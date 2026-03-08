import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NOTION_API_TOKEN: z.string().min(1),
    AGENTFS_DATABASE_URL: z.string().min(1),
    AGENTFS_AUTH_TOKEN: z.string().min(1).optional(),
    TURSO_DATABASE_URL: z.string().min(1),
    TURSO_AUTH_TOKEN: z.string().min(1).optional(),
    CRON_SECRET: z.string().min(16),
    BETTER_AUTH_SECRET: z.string().min(1),
    PHACK_CLIENT_ID: z.string().min(1),
    KV_REST_API_URL: z.url(),
    KV_REST_API_TOKEN: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
});
