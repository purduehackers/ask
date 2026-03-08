import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  devIndicators: false,
  serverExternalPackages: [
    "agentfs-sdk",
    "@tursodatabase/serverless",
    "@tursodatabase/database",
    "bash-tool",
  ],
};

export default withWorkflow(withBotId(nextConfig));
