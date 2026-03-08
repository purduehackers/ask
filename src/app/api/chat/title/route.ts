import { generateText } from "ai";
import { getChatMeta, setChatTitle } from "@/lib/chat-store";

export async function POST(req: Request) {
  const { id, message }: { id: string; message: string } = await req.json();

  if (!id || !message) {
    return Response.json({ error: "Missing id or message" }, { status: 400 });
  }

  const meta = await getChatMeta(id);
  if (!meta) {
    return Response.json({ error: "Chat not found" }, { status: 404 });
  }

  if (meta.title) {
    return Response.json({ title: meta.title });
  }

  const { text } = await generateText({
    model: "anthropic/claude-haiku-4-5-20251001",
    system:
      "Generate a short title (3-6 words) for a conversation that starts with the following message. Return only the title, no quotes or punctuation at the end.",
    prompt: message,
  });

  const title = text.trim();
  await setChatTitle(id, title);

  return Response.json({ title });
}
