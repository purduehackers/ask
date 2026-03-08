import { headers } from "next/headers";
import { env } from "@/env";
import { getCache, getNotionClient, reindex } from "@/lib/notion";

export async function GET() {
  const authorization = (await headers()).get("authorization");
  if (authorization !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cache = await getCache();
  const notion = getNotionClient();
  const stats = await reindex(notion, cache);

  return Response.json(stats);
}
