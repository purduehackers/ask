import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import { stepCountIs, jsonSchema as rawJsonSchema } from "ai";
import type { ModelMessage, UIMessage, UIMessageChunk } from "ai";
import { systemPrompt, bashToolInstructions } from "@/lib/ai/prompts";

// Wrapper that adds validate() for @workflow/ai compatibility
function validatedJsonSchema<T>(schema: Parameters<typeof rawJsonSchema>[0]) {
  const s = rawJsonSchema<T>(schema);
  (s as Record<string, unknown>).validate = (v: unknown) => ({
    success: true as const,
    value: v as T,
  });
  return s;
}

// Lazily initialized sandbox shared across tool calls within a workflow run
let _sandbox: Awaited<ReturnType<typeof initSandbox>> | null = null;

async function initSandbox() {
  const { createBashTool } = await import("bash-tool");
  const { getCache, loadFiles } = await import("@/lib/notion");

  const cache = await getCache();
  const files = await loadFiles(cache);
  return createBashTool({ files, destination: "/", extraInstructions: bashToolInstructions });
}

async function getSandbox() {
  return (_sandbox ??= await initSandbox());
}

const tools = {
  bash: {
    description: `Execute bash commands to explore the Purdue Hackers Notion workspace mounted as a filesystem.
Root directories: /Home, /Design, /Engineering, /Comms, /Finances, /Events
Each page is a .md file. Use ls, cat, grep, find, head, tail, etc.`,
    inputSchema: validatedJsonSchema<{ command: string }>({
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The bash command to execute",
        },
      },
      required: ["command"],
    }),
    async execute({ command }: { command: string }) {
      "use step";
      const toolkit = await getSandbox();
      const result = await toolkit.sandbox.executeCommand(command);
      if (result.exitCode !== 0) {
        return `Exit code: ${result.exitCode}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`;
      }
      return result.stdout;
    },
  },
  readFile: {
    description: "Read the contents of a file at the given path.",
    inputSchema: validatedJsonSchema<{ path: string }>({
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The file path to read",
        },
      },
      required: ["path"],
    }),
    async execute({ path }: { path: string }) {
      "use step";
      const toolkit = await getSandbox();
      return toolkit.sandbox.readFile(path);
    },
  },
};

export async function chatWorkflow(
  messages: ModelMessage[],
  chatId?: string,
  priorUIMessages?: UIMessage[],
) {
  "use workflow";

  const writable = getWritable<UIMessageChunk>();

  const agent = new DurableAgent({
    model: "anthropic/claude-sonnet-4-6",
    system: systemPrompt,
    tools,
  });

  const result = await agent.stream({
    messages,
    writable,
    stopWhen: stepCountIs(30),
    collectUIMessages: true,
  });

  // Persist full message history (prior turns + new assistant response)
  if (chatId && result.uiMessages) {
    const allMessages = [...(priorUIMessages ?? []), ...result.uiMessages];
    await saveMessages(chatId, allMessages);
  }
}

async function saveMessages(chatId: string, uiMessages: UIMessage[]) {
  "use step";
  const { saveChatMessages, clearWorkflowRunId } = await import("@/lib/chat-store");
  await Promise.all([saveChatMessages(chatId, uiMessages), clearWorkflowRunId(chatId)]);
}
