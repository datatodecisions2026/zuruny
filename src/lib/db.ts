import "server-only";
import { Pool, types, type PoolClient, type QueryResultRow } from "pg";

/** The site runs without a database configured; features degrade rather than crash. */
export const dbConfigured = Boolean(process.env.DATABASE_URL);

/* bigint (money in cents, ids) arrives as a string by default. Every value in
   this schema is far below 2^53, so plain numbers are safe and match the types
   the rest of the code already expects. Timestamps become ISO strings. */
types.setTypeParser(20, (v) => Number(v));
types.setTypeParser(1184, (v) => new Date(v).toISOString());

// One pool per process, kept across dev hot reloads.
const g = globalThis as unknown as { __zurunyPool?: Pool };

function pool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  g.__zurunyPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });
  return g.__zurunyPool;
}

/** Parameterised query. Returns [] when the database is not configured. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const p = pool();
  if (!p) return [];
  return (await p.query<T>(text, params)).rows;
}

/** Run several statements atomically; any throw rolls the lot back. */
export async function withTx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const p = pool();
  if (!p) throw new Error("DATABASE_URL is not set");
  const c = await p.connect();
  try {
    await c.query("begin");
    const out = await fn(c);
    await c.query("commit");
    return out;
  } catch (e) {
    await c.query("rollback");
    throw e;
  } finally {
    c.release();
  }
}
