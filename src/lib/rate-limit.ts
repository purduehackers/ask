import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

const anonLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "ratelimit:anon",
});

const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 h"),
  prefix: "ratelimit:auth",
});

export async function checkRateLimit(
  key: string,
  authenticated: boolean,
): Promise<{ allowed: boolean; remaining: number }> {
  if (process.env.NODE_ENV === "development") {
    return { allowed: true, remaining: 999 };
  }
  const limiter = authenticated ? authLimiter : anonLimiter;
  const { success, remaining } = await limiter.limit(key);
  return { allowed: success, remaining };
}
