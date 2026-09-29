// One-off: copy Zuruny's data from the old Supabase project into the new Postgres.
//
//   1. Create the schema on the new database:  psql "$DATABASE_URL" -f db/schema.sql
//   2. Put both connection strings in .env (Supabase's is under
//      Project Settings -> Database -> Connection string, "Session pooler"):
//        DATABASE_URL=postgres://...            (the new VPS database)
//        SUPABASE_DB_URL=postgres://...         (the old one; read-only use)
//   3. node --env-file=.env scripts/migrate-from-supabase.mjs
//
// Safe to re-run: every insert is ON CONFLICT DO NOTHING. Ids are preserved, so
// orders keep pointing at the same users. Password hashes are copied straight
// from auth.users; they are bcrypt, which the new login accepts as-is, so nobody
// has to reset a password. Nothing is written to disk and nothing is logged
// beyond row counts.

import pg from "pg";

const { DATABASE_URL, SUPABASE_DB_URL } = process.env;
if (!DATABASE_URL || !SUPABASE_DB_URL) {
  console.error("Set DATABASE_URL and SUPABASE_DB_URL first (see the header of this file).");
  process.exit(1);
}
if (DATABASE_URL === SUPABASE_DB_URL) {
  console.error("DATABASE_URL and SUPABASE_DB_URL are the same. Refusing to continue.");
  process.exit(1);
}

const src = new pg.Client({ connectionString: SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
const dst = new pg.Client({ connectionString: DATABASE_URL });
await src.connect();
await dst.connect();

// Identity-column tables, parents before children.
const TABLES = [
  ["zuruny_products", ["id", "handle", "name", "kind", "status", "named_after_from", "description", "description_fr", "memory", "pull_quote", "position", "created_at", "updated_at"]],
  ["zuruny_variants", ["id", "product_id", "label", "price_cents", "stock", "available", "position"]],
  ["zuruny_product_images", ["id", "product_id", "src", "width", "height", "alt", "position"]],
  ["zuruny_product_spec", ["id", "product_id", "label", "value", "label_fr", "value_fr", "position"]],
  ["zuruny_orders", ["id", "reference", "user_id", "email", "status", "region", "locale", "subtotal_cents", "currency", "shipping_name", "shipping_address", "shipping_country", "shipping_phone", "payment_provider", "payment_reference", "paid_at", "created_at", "updated_at"]],
  ["zuruny_order_items", ["id", "order_id", "product_handle", "product_name", "variant_label", "qty", "unit_price_cents", "line_total_cents"]],
];

async function copy(table, cols, rows) {
  let n = 0;
  for (const row of rows) {
    const res = await dst.query(
      `insert into ${table} (${cols.join(", ")}) overriding system value
       values (${cols.map((_, i) => `$${i + 1}`).join(", ")})
       on conflict do nothing`,
      cols.map((c) => row[c]),
    );
    n += res.rowCount;
  }
  console.log(`${table}: ${n} inserted, ${rows.length - n} already there`);
}

try {
  await dst.query("begin");

  // Users: profile fields + the bcrypt hash from Supabase Auth. Only people who
  // have a Zuruny profile are copied; the rest of auth.users belongs to other apps.
  const { rows: users } = await src.query(
    `select p.id, coalesce(p.email, u.email) as email, u.encrypted_password as password_hash,
            p.full_name, p.role, p.created_at
       from zuruny_profiles p join auth.users u on u.id = p.id`,
  );
  const bad = users.filter((u) => !u.password_hash?.startsWith("$2"));
  if (bad.length) {
    throw new Error(`${bad.length} user(s) have no bcrypt hash and would be locked out. Aborting.`);
  }
  let n = 0;
  for (const u of users) {
    const res = await dst.query(
      `insert into zuruny_users (id, email, password_hash, full_name, role, created_at)
       values ($1, lower($2), $3, $4, $5, $6) on conflict do nothing`,
      [u.id, u.email, u.password_hash, u.full_name, u.role, u.created_at],
    );
    n += res.rowCount;
  }
  console.log(`zuruny_users: ${n} inserted, ${users.length - n} already there`);

  for (const [table, cols] of TABLES) {
    const { rows } = await src.query(`select ${cols.join(", ")} from ${table} order by id`);
    await copy(table, cols, rows);
    await dst.query(
      `select setval(pg_get_serial_sequence('${table}', 'id'), greatest(coalesce((select max(id) from ${table}), 0), 1))`,
    );
  }

  await dst.query("commit");
  console.log("Done.");
} catch (e) {
  await dst.query("rollback");
  console.error("Rolled back:", e.message);
  process.exitCode = 1;
} finally {
  await src.end();
  await dst.end();
}
