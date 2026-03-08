import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { createAgent } from "@/lib/ai";

function createServer() {
  const server = new McpServer({
    name: "purduehackers_docs",
    version: "0.1.0",
  });

  server.registerTool(
    "ask",
    {
      description:
        "Ask a question about Purdue Hackers by searching their Notion workspace. Returns a text answer with citations to specific Notion pages.",
      inputSchema: {
        question: z.string().describe("The question to ask about Purdue Hackers"),
      },
    },
    async ({ question }) => {
      const agent = await createAgent();
      const result = await agent.generate({ prompt: question });
      return { content: [{ type: "text" as const, text: result.text }] };
    },
  );

  return server;
}

const transports = new Map<string, WebStandardStreamableHTTPServerTransport>();

async function requireAuth(req: Request): Promise<Response | undefined> {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return Response.json({ error: "Missing or invalid API key" }, { status: 401 });
  }
  const { valid } = await auth.api.verifyApiKey({
    body: { key: authorization.slice(7) },
  });
  if (!valid) {
    return Response.json({ error: "Missing or invalid API key" }, { status: 401 });
  }
}

function getTransport(req: Request): WebStandardStreamableHTTPServerTransport | Response {
  const sessionId = req.headers.get("mcp-session-id");
  if (!sessionId || !transports.has(sessionId)) {
    return Response.json({ error: "Invalid or missing session" }, { status: 400 });
  }
  return transports.get(sessionId)!;
}

export async function POST(req: Request) {
  const authError = await requireAuth(req);
  if (authError) return authError;

  const sessionId = req.headers.get("mcp-session-id");

  if (sessionId && transports.has(sessionId)) {
    return transports.get(sessionId)!.handleRequest(req);
  }

  if (sessionId) {
    return Response.json(
      { error: "Session not found. Start a new session without mcp-session-id." },
      { status: 404 },
    );
  }

  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (id) => {
      transports.set(id, transport);
    },
  });

  transport.onclose = () => {
    const id = transport.sessionId;
    if (id) transports.delete(id);
  };

  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function GET(req: Request) {
  const authError = await requireAuth(req);
  if (authError) return authError;

  const transport = getTransport(req);
  if (transport instanceof Response) return transport;

  return transport.handleRequest(req);
}

export async function DELETE(req: Request) {
  const authError = await requireAuth(req);
  if (authError) return authError;

  const transport = getTransport(req);
  if (transport instanceof Response) return transport;

  await transport.close();
  return new Response(null, { status: 204 });
}
