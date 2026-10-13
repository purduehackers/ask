import { createClient } from "redis";
import { env } from "@/env";

const client = createClient({
  url: env.REDIS_URL,
  socket: { connectTimeout: 5000, reconnectStrategy: false },
  disableOfflineQueue: true,
});
client.on("error", () => console.error("Redis connection failed"));
let connecting: Promise<unknown> | undefined;

/** Share one lazy TCP/TLS connection across concurrent requests. */
export async function getRedis() {
  if (!client.isOpen) {
    connecting ??= client.connect().finally(() => {
      connecting = undefined;
    });
  }
  await connecting;
  return client.withCommandOptions({ timeout: 5000 });
}
