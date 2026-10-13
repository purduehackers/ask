import { z } from "zod";
import type { getRedis } from "./redis";

// Keep Upstash's two-bucket approximation and key format so copied counters
// continue to count. The read/check/increment is atomic across app instances.
const CONSUME = `
local limit = tonumber(ARGV[1])
local now = tonumber(ARGV[2])
local window = tonumber(ARGV[3])
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
local previous = tonumber(redis.call('GET', KEYS[2]) or '0')
local weighted = math.floor((1 - (now % window) / window) * previous)
if current + weighted >= limit then return -1 end
local used = redis.call('INCR', KEYS[1])
if used == 1 then redis.call('PEXPIRE', KEYS[1], window * 2 + 1000) end
return limit - used - weighted
`;

/** Consume one request without extending the lifetime of an existing bucket. */
export async function checkSlidingWindow(
  redis: Pick<Awaited<ReturnType<typeof getRedis>>, "eval">,
  identifier: string,
  limit: number,
  now = Date.now(),
  windowMs = 60 * 60 * 1000,
): Promise<{ allowed: boolean; remaining: number }> {
  const bucket = Math.floor(now / windowMs);
  const result = await redis.eval(CONSUME, {
    keys: [`${identifier}:${bucket}`, `${identifier}:${bucket - 1}`],
    arguments: [String(limit), String(now), String(windowMs)],
  });
  const remaining = z.number().int().min(-1).parse(result);
  return { allowed: remaining >= 0, remaining: Math.max(0, remaining) };
}
