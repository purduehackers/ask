"use client";

import { createAuthClient } from "better-auth/react";
import { genericOAuthClient } from "better-auth/client/plugins";
import { apiKeyClient } from "@better-auth/api-key/client";

export const authClient = createAuthClient({
  plugins: [genericOAuthClient(), apiKeyClient()],
});

// oxlint-disable-next-line @factory/constants-file-organization -- re-exports for convenience
export const { useSession, signOut } = authClient;
