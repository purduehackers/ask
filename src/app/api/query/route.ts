import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAgent } from "@/lib/ai";

export async function POST(req: Request) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return Response.json({ error: "Missing API key" }, { status: 401 });
  }

  const { valid, error, key } = await auth.api.verifyApiKey({
    body: { key: authorization.slice(7) },
  });
  if (!valid || !key) {
    return Response.json({ error: error?.message ?? "Invalid API key" }, { status: 401 });
  }

  const rateLimitKey = key.referenceId ?? key.id;
  const { allowed, remaining } = await checkRateLimit(rateLimitKey, true);
  if (!allowed) {
    return Response.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  const { prompt } = await req.json();
  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "Missing 'prompt' in request body" }, { status: 400 });
  }

  const agent = await createAgent();
  const result = await agent.generate({ prompt });

  return Response.json(
    { result: result.text },
    { headers: { "X-RateLimit-Remaining": String(remaining) } },
  );
}
