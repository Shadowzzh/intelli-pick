// packages/db/src/client.ts
import { env } from "@intellipick/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, { schema });
export type Database = typeof db;
