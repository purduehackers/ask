import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/env";

import { accounts } from "./schema/accounts";
import { apikeys } from "./schema/apikeys";
import { sessions } from "./schema/sessions";
import { users } from "./schema/users";
import { verifications } from "./schema/verifications";
import * as relations from "./schema/relations";

const client = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

// oxlint-disable-next-line @factory/constants-file-organization -- drizzle schema aggregate
export const schema = {
  accounts,
  apikeys,
  sessions,
  users,
  verifications,
  ...relations,
};

export const db = drizzle(client, {
  schema,
});
