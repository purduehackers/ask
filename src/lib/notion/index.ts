import { AgentFS } from "agentfs-sdk";
import { createClient, type NotionFsClient } from "@rayhanadev/notion-fs";
import { env } from "@/env";
import { CacheService } from "./cache";
import { RemoteDatabase } from "./database";

type DatabasePromise = Parameters<typeof AgentFS.openWith>[0];

let _cache: CacheService | null = null;
let _notion: NotionFsClient | null = null;

export async function getCache(): Promise<CacheService> {
  if (!_cache) {
    const db = new RemoteDatabase(env.AGENTFS_DATABASE_URL, {
      authToken: env.AGENTFS_AUTH_TOKEN,
    });
    const agent = await AgentFS.openWith(db as unknown as DatabasePromise);
    _cache = new CacheService(agent);
  }
  return _cache;
}

export function getNotionClient(): NotionFsClient {
  return (_notion ??= createClient({ token: env.NOTION_API_TOKEN }));
}

export { reindex, loadFiles } from "./filesystem";
