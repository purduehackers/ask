import { createUIMessageStreamResponse } from "ai";
import { getRun } from "workflow/api";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);

  const startIndex = searchParams.has("startIndex")
    ? Number(searchParams.get("startIndex"))
    : undefined;

  const run = getRun(id);
  const stream = run.getReadable({ startIndex });

  return createUIMessageStreamResponse({ stream });
}
