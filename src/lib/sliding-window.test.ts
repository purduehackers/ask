import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createClient } from "redis";
import { checkSlidingWindow } from "./sliding-window";

const url = process.env.REDIS_TEST_URL;

describe.skipIf(!url)("Redis sliding window", () => {
  const client = createClient({ url, socket: { reconnectStrategy: false, connectTimeout: 5000 } });
  const prefix = `migration-test:ask:${crypto.randomUUID()}`;
  const keys: string[] = [];
  client.on("error", () => {});

  beforeAll(async () => {
    await client.connect();
  });
  afterAll(async () => {
    try {
      if (keys.length) await client.del(keys);
    } finally {
      client.destroy();
    }
  });

  test("concurrent anonymous requests admit exactly five; rejected requests do not consume quota", async () => {
    const id = `${prefix}:anon`;
    keys.push(`${id}:10`);
    const results = await Promise.all(
      Array.from({ length: 20 }, () => checkSlidingWindow(client, id, 5, 10_000, 1000)),
    );
    expect(results.filter((result) => result.allowed)).toHaveLength(5);
    expect(await client.get(`${id}:10`)).toBe("5");
    expect(await client.pTTL(`${id}:10`)).toBeGreaterThan(0);
    expect(results.every((result) => result.remaining >= 0)).toBe(true);
  });

  test("authenticated requests retain the thirty-request allowance", async () => {
    const id = `${prefix}:auth`;
    keys.push(`${id}:10`);
    const results = await Promise.all(
      Array.from({ length: 35 }, () => checkSlidingWindow(client, id, 30, 10_000, 1000)),
    );
    expect(results.filter((result) => result.allowed)).toHaveLength(30);
  });

  test("copied Upstash buckets count across the hour boundary", async () => {
    const id = `${prefix}:legacy`;
    keys.push(`${id}:9`, `${id}:10`);
    await client.set(`${id}:9`, "5", { EX: 60 });
    expect(await checkSlidingWindow(client, id, 5, 10_000, 1000)).toEqual({
      allowed: false,
      remaining: 0,
    });
    expect(await checkSlidingWindow(client, id, 5, 10_500, 1000)).toEqual({
      allowed: true,
      remaining: 2,
    });
  });
});
