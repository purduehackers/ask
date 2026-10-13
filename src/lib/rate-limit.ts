import { getRedis } from "./redis";
import { checkSlidingWindow } from "./sliding-window";

export async function checkRateLimit(
  key: string,
  authenticated: boolean,
): Promise<{ allowed: boolean; remaining: number }> {
  if (process.env.NODE_ENV === "development") {
    return { allowed: true, remaining: 999 };
  }
  const prefix = authenticated ? "ratelimit:auth" : "ratelimit:anon";
  return checkSlidingWindow(await getRedis(), `${prefix}:${key}`, authenticated ? 30 : 5);
}
