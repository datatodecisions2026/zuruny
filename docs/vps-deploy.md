# Deploying zuruny on the VPS (with its own Postgres)

Same layout as `DEPLOY-zuruny.md`: `https://zuruny.datatodecisions.org` on the shared Hostinger
VPS (`srv1723841`), next to the existing apps. It adds one thing the reference doesn't have: a
Postgres database that replaces Supabase. Nothing here touches the other apps' PM2 processes,
nginx blocks, DNS records or databases.

| Placeholder | Meaning |
|---|---|
| `<PORT>` | a free port, chosen in step 2 |
| `<DB_PASSWORD>` | generate one in step 3 |

Repo: `https://github.com/datatodecisions2026/zuruny.git` (add a token or deploy key if it is private).

---

## 0. Before you go to the VPS (on your PC)

The VPS clones from GitHub, and the Supabase-to-Postgres change is not committed yet. Commit and
push it first, or the server will build the old Supabase version. Only the code changes below
belong in it (not `.tmp/`, the `.zip`, `graphify-out/` or `public/hero_scenes/`):

```bash
git add .env.example package.json package-lock.json db scripts docs/vps-deploy.md src/app src/lib
git status --short       # check: no .tmp/, .zip, graphify-out/ or hero_scenes/ in the staged list
git commit -m "feat: replace Supabase with self-hosted Postgres and own auth"
git push origin main
```

## 1. DNS (Hostinger panel)

Add a record to `datatodecisions.org` (skip if it already exists):

| Type | Name | Value |
|---|---|---|
| A | `zuruny` | the same IP the existing `hitech` A record points to |

```bash
nslookup zuruny.datatodecisions.org
```

## 2. Pick a free port, and check for Postgres

```bash
sudo ss -tlnp | grep LISTEN
```

- Pick a port for the app that isn't listed (`3010` is a likely candidate).
- Look for `5432`. Listed means a Postgres is already running: use it (step 3 only creates a new
  user and database in it) and never change its config. Not listed means step 3 installs one.

```bash
psql --version     # needs 13 or newer
node -v            # needs 20.9 or newer (Next 16)
```

## 3. Postgres: a new database for this app only

If nothing is on 5432:

```bash
sudo apt update && sudo apt install -y postgresql
```

Then, in either case (this adds a user and a database; it does not alter anything existing):

```bash
openssl rand -hex 24     # copy the output; this is <DB_PASSWORD>
sudo -u postgres psql -c "create user zuruny with password '<DB_PASSWORD>';"
sudo -u postgres psql -c "create database zuruny owner zuruny;"
```

Keep Postgres on localhost only (the default). There is no row-level security any more, so this
database must never be reachable from outside the VPS.

## 4. Clone, install, configure, build

```bash
cd /var/www
git clone https://github.com/datatodecisions2026/zuruny.git zuruny
cd zuruny
npm install
cp .env.example .env.local && nano .env.local
```

Fill in `.env.local`:

```
DATABASE_URL=postgres://zuruny:<DB_PASSWORD>@127.0.0.1:5432/zuruny
SUPABASE_DB_URL=<Supabase → Project Settings → Database → Connection string → Session pooler>
PAYSTACK_SECRET_KEY=...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=...
PAYSTACK_CURRENCY=USD
```

Create the tables, then build:

```bash
psql "$(grep ^DATABASE_URL .env.local | cut -d= -f2-)" -f db/schema.sql
npm run build
```

`schema.sql` is safe to run again at any time.

## 5. Move the data from Supabase (once)

```bash
node --env-file=.env.local scripts/migrate-from-supabase.mjs
```

Expected: a count per table (products 10, variants 14, images 12, spec 21, users 12, orders 0).
It copies the 12 Zuruny customers with their existing password hashes, so nobody resets a
password, and the one admin stays an admin. It stops and rolls back if anything looks wrong, and
is safe to re-run.

Then remove `SUPABASE_DB_URL` from `.env.local`.

## 6. PM2

```bash
pm2 start npm --name zuruny -- run start -- -p <PORT>
pm2 save
pm2 logs zuruny --lines 30 --nostream
```

Run **one** instance only. The login throttle is kept in memory, so `-i` / cluster mode would
split it. If the logs show `EADDRINUSE`, run `pm2 delete zuruny`, pick another port and repeat.

The logs will repeat `No country header on this request — pricing everyone as INTL`. That is
expected for now, see the note in step 9.

## 7. nginx

Create a new server block, exactly as in the reference. Don't edit any existing one.

```bash
sudo nano /etc/nginx/sites-available/zuruny
```

```nginx
server {
    listen 80;
    server_name zuruny.datatodecisions.org;

    location / {
        proxy_pass http://127.0.0.1:<PORT>;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/zuruny /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Always run `nginx -t` before reloading. `Host` and `X-Real-IP` matter to this app: checkout
builds its return URL from `Host`, and the login throttle keys on `X-Real-IP`.

## 8. SSL

```bash
sudo certbot --nginx -d zuruny.datatodecisions.org
```

Leave the lines certbot adds. HTTPS is required: the session cookie is `Secure` in production,
so login does not work over plain HTTP.

## 9. Paystack, and one known limitation

- Paystack dashboard → Settings → API Keys & Webhooks → webhook URL:
  `https://zuruny.datatodecisions.org/api/paystack/webhook`
- **Lebanon pricing uses the visitor address** when nginx sends no country header.
  The block above must keep `X-Real-IP $remote_addr`. A country header
  (`cf-ipcountry`, `x-vercel-ip-country`, `x-geo-country`) still wins when one is present.

## 10. Verify

- `https://zuruny.datatodecisions.org` loads, and `/shop` shows the 10 products from your database.
- Sign in with an existing account. Check `/admin` with the admin account, and that a normal
  customer is refused.
- Create a new account, sign out, sign back in.
- `pm2 list` shows `zuruny` online and the other apps still online.
- The other sites (such as `https://hitech.datatodecisions.org`) still load.

Make someone an admin:

```bash
psql "$(grep ^DATABASE_URL .env.local | cut -d= -f2-)" \
  -c "update zuruny_users set role='admin' where email='you@example.com'"
```

---

## Redeploying

```bash
cd /var/www/zuruny
git pull
npm install
psql "$(grep ^DATABASE_URL .env.local | cut -d= -f2-)" -f db/schema.sql   # only if schema.sql changed
npm run build
pm2 restart zuruny
```

`NEXT_PUBLIC_*` env vars are baked in at build time. After changing one, rebuild.

## Backups (Supabase used to do this; now it is yours)

```bash
mkdir -p /var/backups/zuruny
crontab -e
```

```
0 3 * * * pg_dump "postgres://zuruny:<DB_PASSWORD>@127.0.0.1:5432/zuruny" | gzip > /var/backups/zuruny/zuruny-$(date +\%F).sql.gz && find /var/backups/zuruny -mtime +14 -delete
```

Copy a dump off the VPS now and then. A backup on the same disk doesn't survive losing the disk.

## Switching to its own domain later

Same as the reference (DNS, nginx `server_name`, certbot), plus:

- **Paystack:** change the webhook URL to the new domain.
- **Customers sign in again once.** The session cookie belongs to the old host. Accounts, orders
  and passwords are unaffected.
- **Pricing:** this is the moment to add Cloudflare so Lebanon pricing works (step 9).
- No app or database change is needed. `DATABASE_URL` stays as it is.

## Removing the app entirely

Everything in the reference's removal steps, plus the database, after a backup:

```bash
pg_dump "postgres://zuruny:<DB_PASSWORD>@127.0.0.1:5432/zuruny" | gzip > ~/zuruny-final.sql.gz
sudo -u postgres psql -c "drop database zuruny;" -c "drop user zuruny;"
```
