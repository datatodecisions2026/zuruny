-- Zuruny schema for plain Postgres (no Supabase). Idempotent: safe to re-run.
--
-- Differences from the Supabase version:
--   * zuruny_profiles + auth.users are one table, zuruny_users (with the bcrypt hash).
--   * Sessions are rows in zuruny_sessions, not JWTs.
--   * No RLS. The rules it enforced (customers see their own orders, only
--     admins write the catalogue, drafts are hidden) live in src/lib/*.ts.
--     The app connects with one role; do not expose this database publicly.

create table if not exists zuruny_users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  password_hash text not null,
  full_name     text,
  role          text not null default 'customer' check (role in ('customer', 'admin')),
  created_at    timestamptz not null default now()
);
create unique index if not exists zuruny_users_email_key on zuruny_users (lower(email));

-- token_hash is sha256 of the cookie value, so a leaked table cannot be replayed.
create table if not exists zuruny_sessions (
  token_hash text primary key,
  user_id    uuid not null references zuruny_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists zuruny_sessions_user_id_idx on zuruny_sessions (user_id);
create index if not exists zuruny_sessions_expires_idx on zuruny_sessions (expires_at);

create table if not exists zuruny_products (
  id               bigint generated always as identity primary key,
  handle           text not null unique,
  name             text not null,
  kind             text not null check (kind in ('olive-oil','carob-molasses','grape-molasses','carafe','coaster')),
  status           text not null default 'draft' check (status in ('active','draft')),
  named_after_from text,
  description      text not null default '',
  description_fr   text,
  memory           text,
  pull_quote       text,
  position         integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists zuruny_products_status_idx on zuruny_products (status, position);

create table if not exists zuruny_variants (
  id          bigint generated always as identity primary key,
  product_id  bigint not null references zuruny_products(id) on delete cascade,
  label       text,
  price_cents bigint check (price_cents is null or price_cents >= 0),
  stock       integer not null default 0 check (stock >= 0),
  available   boolean not null default true,
  position    integer not null default 0
);
create index if not exists zuruny_variants_product_id_idx on zuruny_variants (product_id);

create table if not exists zuruny_product_images (
  id         bigint generated always as identity primary key,
  product_id bigint not null references zuruny_products(id) on delete cascade,
  src        text not null,
  width      integer not null,
  height     integer not null,
  alt        text not null default '',
  position   integer not null default 0
);
create index if not exists zuruny_product_images_product_id_idx on zuruny_product_images (product_id);

create table if not exists zuruny_product_spec (
  id         bigint generated always as identity primary key,
  product_id bigint not null references zuruny_products(id) on delete cascade,
  label      text not null,
  value      text not null,
  label_fr   text,
  value_fr   text,
  position   integer not null default 0
);
create index if not exists zuruny_product_spec_product_id_idx on zuruny_product_spec (product_id);

create table if not exists zuruny_orders (
  id                bigint generated always as identity primary key,
  reference         text not null unique,
  user_id           uuid references zuruny_users(id) on delete set null,
  email             text not null,
  status            text not null default 'pending_payment'
                    check (status in ('pending_payment','paid','failed','cancelled','shipped','refunded')),
  region            text not null check (region in ('LB','INTL')),
  locale            text not null default 'en' check (locale in ('en','fr')),
  subtotal_cents    bigint not null check (subtotal_cents >= 0),
  currency          text not null default 'USD',
  shipping_name     text,
  shipping_address  text,
  shipping_country  text,
  shipping_phone    text,
  payment_provider  text not null default 'paystack',
  payment_reference text,
  paid_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists zuruny_orders_status_idx  on zuruny_orders (status, created_at desc);
create index if not exists zuruny_orders_user_id_idx on zuruny_orders (user_id, created_at desc);

create table if not exists zuruny_order_items (
  id               bigint generated always as identity primary key,
  order_id         bigint not null references zuruny_orders(id) on delete cascade,
  product_handle   text not null,
  product_name     text not null,
  variant_label    text,
  qty              integer not null check (qty > 0),
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  line_total_cents bigint not null check (line_total_cents >= 0)
);
create index if not exists zuruny_order_items_order_id_idx on zuruny_order_items (order_id);

create or replace function zuruny_touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['zuruny_products', 'zuruny_orders'] loop
    if not exists (select 1 from pg_trigger where tgname = t || '_touch') then
      execute format(
        'create trigger %I before update on %I for each row execute function zuruny_touch_updated_at()',
        t || '_touch', t);
    end if;
  end loop;
end $$;

-- "The Names" journal. A chapter is a product retold as a page-flip book: a
-- required dedication image, then optional portrait/place/product photos and
-- any number of extra detail shots. The story text is product.memory —
-- already above — a chapter only adds the book-specific images and ordering.
create table if not exists zuruny_chapters (
  id          bigint generated always as identity primary key,
  product_id  bigint not null unique references zuruny_products(id) on delete cascade,
  slug        text not null unique,
  -- A chapter may show a product that is still a draft everywhere else — the
  -- one case the storefront allows (see docs/namesJournal history: Najibe).
  allow_draft boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists zuruny_chapter_images (
  id         bigint generated always as identity primary key,
  chapter_id bigint not null references zuruny_chapters(id) on delete cascade,
  kind       text not null check (kind in ('dedication', 'product', 'place', 'portrait', 'detail')),
  src        text not null,
  width      integer not null,
  height     integer not null,
  alt        text not null default '',
  position   integer not null default 0
);
create index if not exists zuruny_chapter_images_chapter_id_idx on zuruny_chapter_images (chapter_id);
