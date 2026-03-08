import { UIMessage, convertToModelMessages, createUIMessageStreamResponse } from "ai";
import { checkBotId } from "botid/server";
import { headers } from "next/headers";
import { start } from "workflow/api";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createChat,
  getChatMeta,
  claimChat,
  saveChatMessages,
  setWorkflowRunId,
} from "@/lib/chat-store";
import { chatWorkflow } from "@/workflows/chat/workflow";

export async function POST(req: Request) {
  const headersList = await headers();

  const { isBot } = await checkBotId();
  if (isBot) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let userId: string | null = null;
  let authenticated = false;

  const authorization = headersList.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const { valid, key } = await auth.api.verifyApiKey({
      body: { key: authorization.slice(7) },
    });
    if (valid && key) {
      userId = key.referenceId;
      authenticated = true;
    }
  }

  if (!authenticated) {
    const session = await auth.api.getSession({ headers: headersList });
    if (session?.user) {
      userId = session.user.id;
      authenticated = true;
    }
  }

  const rateLimitKey = userId ?? headersList.get("x-forwarded-for") ?? "anonymous";
  const { allowed, remaining } = await checkRateLimit(rateLimitKey, authenticated);
  if (!allowed) {
    return Response.json(
      { error: "Rate limit exceeded. Sign in for higher limits." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  const { id: chatId, messages }: { id?: string; messages: UIMessage[] } = await req.json();

  // Chat ownership enforcement
  if (chatId) {
    const meta = await getChatMeta(chatId);
    if (meta) {
      // Existing chat — enforce ownership
      if (meta.ownerId !== null && meta.ownerId !== userId) {
        return Response.json({ error: "You don't have access to this chat." }, { status: 403 });
      }
      // Anonymous chat with messages already sent — require auth to continue
      if (meta.ownerId === null && messages.length > 2 && !authenticated) {
        return Response.json({ error: "Sign in to continue this conversation." }, { status: 401 });
      }
      // Claim anonymous chat for authenticated user
      if (meta.ownerId === null && authenticated && userId) {
        await claimChat(chatId, userId);
      }
    } else {
      // New chat — create it
      await createChat(chatId, userId);
    }
  }

  if (chatId) await saveChatMessages(chatId, messages);

  const modelMessages = await convertToModelMessages(messages);
  const run = await start(chatWorkflow, [modelMessages, chatId, messages]);

  if (chatId) await setWorkflowRunId(chatId, run.runId);

  return createUIMessageStreamResponse({
    stream: run.readable,
    headers: {
      "X-RateLimit-Remaining": String(remaining),
      "x-workflow-run-id": run.runId,
    },
  });
}
