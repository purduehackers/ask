import { ToolLoopAgent, stepCountIs } from "ai";
import { createBashTool } from "bash-tool";
import { getCache, loadFiles } from "@/lib/notion";
import { systemPrompt, bashToolInstructions } from "@/lib/ai/prompts";

export async function createAgent() {
  const cache = await getCache();
  const files = await loadFiles(cache);
  const { tools } = await createBashTool({
    files,
    destination: "/",
    extraInstructions: bashToolInstructions,
  });

  return new ToolLoopAgent({
    model: "anthropic/claude-sonnet-4.6",
    instructions: systemPrompt,
    tools,
    stopWhen: stepCountIs(30),
  });
}
