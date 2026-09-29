// Creates the owner's admin account, or resets its password if it already
// exists. There is no public sign-up for /admin — this script is the only
// way in.
//
//   node --env-file=.env.local scripts/seed-admin.mjs admin@zuruny.com 'Pass1234'

import bcrypt from "bcryptjs";
import pg from "pg";

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: node scripts/seed-admin.mjs <email> <password>");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Use a password of at least 8 characters.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("Set DATABASE_URL first (see db/schema.sql and .env.example).");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const passwordHash = await bcrypt.hash(password, 10);
await client.query(
  `insert into zuruny_admins (email, password_hash)
   values (lower($1), $2)
   on conflict (lower(email)) do update set password_hash = excluded.password_hash`,
  [email, passwordHash],
);

console.log(`Admin ready: ${email.toLowerCase()}`);
await client.end();
