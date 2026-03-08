import type { UIMessage } from "ai";
import { redis } from "./redis";

const TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

interface ChatMeta {
  ownerId: string | null;
  createdAt: number;
  workflowRunId?: string | null;
  title?: string | null;
}

function metaKey(id: string) {
  return `chat:${id}:meta`;
}

function messagesKey(id: string) {
  return `chat:${id}:messages`;
}

export async function createChat(id: string, ownerId: string | null): Promise<void> {
  const meta: ChatMeta = { ownerId, createdAt: Date.now() };
  await redis.set(metaKey(id), meta, { ex: TTL_SECONDS });
}

export async function getChatMeta(id: string): Promise<ChatMeta | null> {
  return redis.get<ChatMeta>(metaKey(id));
}

async function updateChatMeta(id: string, updates: Partial<ChatMeta>): Promise<void> {
  const meta = await getChatMeta(id);
  if (!meta) return;
  Object.assign(meta, updates);
  await redis.set(metaKey(id), meta, { ex: TTL_SECONDS });
}

export async function claimChat(id: string, ownerId: string): Promise<boolean> {
  const meta = await getChatMeta(id);
  if (!meta) return false;
  if (meta.ownerId !== null) return meta.ownerId === ownerId;
  await redis.set(metaKey(id), { ...meta, ownerId }, { ex: TTL_SECONDS });
  return true;
}

export async function getChatMessages(id: string): Promise<UIMessage[] | null> {
  return redis.get<UIMessage[]>(messagesKey(id));
}

export async function saveChatMessages(id: string, messages: UIMessage[]): Promise<void> {
  await redis.set(messagesKey(id), messages, { ex: TTL_SECONDS });
}

export async function setWorkflowRunId(id: string, workflowRunId: string): Promise<void> {
  await updateChatMeta(id, { workflowRunId });
}

export async function clearWorkflowRunId(id: string): Promise<void> {
  await updateChatMeta(id, { workflowRunId: null });
}

export async function setChatTitle(id: string, title: string): Promise<void> {
  await updateChatMeta(id, { title });
}
