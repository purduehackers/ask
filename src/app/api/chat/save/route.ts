import type { UIMessage } from "ai";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getChatMeta, saveChatMessages, clearWorkflowRunId } from "@/lib/chat-store";

export async function POST(req: Request) {
  const { id, messages }: { id: string; messages: UIMessage[] } = await req.json();

  if (!id || !messages) {
    return Response.json({ error: "Missing id or messages" }, { status: 400 });
  }

  const meta = await getChatMeta(id);
  if (!meta) {
    return Response.json({ error: "Chat not found" }, { status: 404 });
  }

  // If chat has an owner, verify the caller is the owner
  if (meta.ownerId !== null) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.id !== meta.ownerId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await Promise.all([saveChatMessages(id, messages), clearWorkflowRunId(id)]);
  return Response.json({ ok: true });
}
