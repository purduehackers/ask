import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";

const url = process.env.REDIS_TEST_URL;

describe.skipIf(!url)("native Redis chat history", () => {
  const id = `migration-test:ask:${crypto.randomUUID()}`;
  let store: typeof import("./chat-store");
  let redis: Awaited<ReturnType<typeof import("./redis").getRedis>>;

  beforeAll(async () => {
    mock.module("@/env", () => ({ env: { REDIS_URL: url } }));
    store = await import("./chat-store");
    redis = await (await import("./redis")).getRedis();
  });

  afterAll(async () => {
    try {
      await redis.del([`chat:${id}:meta`, `chat:${id}:messages`]);
    } finally {
      redis.destroy();
    }
  });

  test("legacy JSON, ownership, messages, and the 30-day TTL survive the client change", async () => {
    expect(await store.getChatMeta(id)).toBeNull();
    await redis.set(`chat:${id}:meta`, JSON.stringify({ ownerId: null, createdAt: 123 }), {
      EX: 60,
    });
    expect(await store.getChatMeta(id)).toEqual({ ownerId: null, createdAt: 123 });
    expect(await store.claimChat(id, "owner")).toBe(true);
    expect(await store.claimChat(id, "other")).toBe(false);
    await store.setChatTitle(id, "Saved title");
    await store.setWorkflowRunId(id, "workflow-test");
    await store.clearWorkflowRunId(id);
    expect(await store.getChatMeta(id)).toEqual({
      ownerId: "owner",
      createdAt: 123,
      title: "Saved title",
      workflowRunId: null,
    });
    await store.saveChatMessages(id, [
      {
        id: "message-test",
        role: "user",
        parts: [{ type: "text", text: "Preserve this history" }],
      },
    ]);
    expect(await store.getChatMessages(id)).toEqual([
      {
        id: "message-test",
        role: "user",
        parts: [{ type: "text", text: "Preserve this history" }],
      },
    ]);
    expect(await redis.ttl(`chat:${id}:meta`)).toBeGreaterThan(30 * 86400 - 10);
    expect(await redis.ttl(`chat:${id}:messages`)).toBeGreaterThan(30 * 86400 - 10);
  });
});
