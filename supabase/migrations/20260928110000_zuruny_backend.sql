-- Zuruny storefront backend.
--
-- The Next.js app already reads and writes these tables. This migration is
-- what actually creates them. Apply it in the Supabase SQL editor, or with
-- `supabase db push` once the CLI is linked to the project.
--
-- Money stays in integer cents. A visitor never inserts an order: checkout
-- uses the service role, after the server has priced the basket itself.
-- Stock is reserved when the line items are written and returned if payment
-- fails or the order is abandoned before payment.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to postgres, service_role, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

create table public.zuruny_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  -- Role is never copied from user metadata. Metadata is editable by the
  -- account holder, so it cannot decide who is an admin.
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

comment on table public.zuruny_profiles is
  'One row per auth user. Promote a shop owner with: update public.zuruny_profiles set role = ''admin'' where id = ''<user uuid>'';';

create or replace function private.handle_new_zuruny_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.zuruny_profiles (id, full_name)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_zuruny_user() from public;
grant execute on function private.handle_new_zuruny_user() to postgres, service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant usage on schema private to supabase_auth_admin;
    grant execute on function private.handle_new_zuruny_user() to supabase_auth_admin;
  end if;
end;
$$;

drop trigger if exists on_auth_user_created_zuruny_profile on auth.users;
create trigger on_auth_user_created_zuruny_profile
  after insert on auth.users
  for each row execute function private.handle_new_zuruny_user();

insert into public.zuruny_profiles (id, full_name)
select
  u.id,
  nullif(btrim(u.raw_user_meta_data ->> 'full_name'), '')
from auth.users as u
on conflict (id) do nothing;

-- Reads profiles while bypassing RLS, so policies can call it without
-- recursing. Returns only a boolean for the current user.
create or replace function private.is_zuruny_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.zuruny_profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function private.is_zuruny_admin() from public;
grant execute on function private.is_zuruny_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

create table public.zuruny_products (
  id bigint generated always as identity primary key,
  handle text not null unique,
  name text not null,
  kind text not null check (
    kind in (
      'olive-oil',
      'carob-molasses',
      'grape-molasses',
      'carafe',
      'coaster'
    )
  ),
  status text not null default 'draft' check (status in ('active', 'draft')),
  named_after_from text,
  description text not null default '',
  description_fr text,
  memory text,
  pull_quote text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index zuruny_products_status_position_idx
  on public.zuruny_products (status, position);

create table public.zuruny_variants (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.zuruny_products (id) on delete cascade,
  label text,
  price_cents integer check (price_cents is null or price_cents >= 0),
  stock integer not null default 0 check (stock >= 0),
  available boolean not null default false,
  position integer not null default 0
);

create index zuruny_variants_product_id_idx
  on public.zuruny_variants (product_id, position);

create unique index zuruny_variants_product_label_idx
  on public.zuruny_variants (product_id, coalesce(label, ''));

create table public.zuruny_product_images (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.zuruny_products (id) on delete cascade,
  src text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  alt text not null default '',
  position integer not null default 0
);

create index zuruny_product_images_product_id_idx
  on public.zuruny_product_images (product_id, position);

create table public.zuruny_product_spec (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.zuruny_products (id) on delete cascade,
  label text not null,
  value text not null,
  label_fr text,
  value_fr text,
  position integer not null default 0
);

create index zuruny_product_spec_product_id_idx
  on public.zuruny_product_spec (product_id, position);

create or replace function private.touch_zuruny_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.touch_zuruny_updated_at() from public;
grant execute on function private.touch_zuruny_updated_at() to authenticated, service_role;

drop trigger if exists zuruny_products_touch_updated_at on public.zuruny_products;
create trigger zuruny_products_touch_updated_at
  before update on public.zuruny_products
  for each row execute function private.touch_zuruny_updated_at();

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table public.zuruny_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  email text,
  status text not null default 'pending_payment' check (
    status in ('pending_payment', 'paid', 'failed')
  ),
  region text not null check (region in ('LB', 'INTL')),
  locale text not null check (locale in ('en', 'fr')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  currency text not null default 'USD',
  shipping_name text,
  shipping_address text,
  shipping_country text,
  shipping_phone text,
  payment_provider text,
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index zuruny_orders_user_created_idx
  on public.zuruny_orders (user_id, created_at desc);

create table public.zuruny_order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.zuruny_orders (id) on delete cascade,
  product_handle text not null,
  product_name text not null,
  variant_label text,
  qty integer not null check (qty > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_total_cents integer not null check (line_total_cents = unit_price_cents * qty)
);

create index zuruny_order_items_order_id_idx
  on public.zuruny_order_items (order_id);

-- delta is negative to reserve, positive to give stock back.
-- A reserve that cannot be filled raises, so two checkouts cannot sell the
-- last jar twice: the second insert fails and the app deletes that order.
create or replace function private.adjust_zuruny_stock(
  p_handle text,
  p_label text,
  p_delta integer
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if p_delta = 0 then
    return;
  end if;

  if p_delta < 0 then
    update public.zuruny_variants as v
    set
      stock = v.stock + p_delta,
      available = (v.stock + p_delta) > 0
    from public.zuruny_products as p
    where p.id = v.product_id
      and p.handle = p_handle
      and v.label is not distinct from p_label
      and v.stock >= -p_delta;
  else
    update public.zuruny_variants as v
    set
      stock = v.stock + p_delta,
      available = (v.stock + p_delta) > 0
    from public.zuruny_products as p
    where p.id = v.product_id
      and p.handle = p_handle
      and v.label is not distinct from p_label;
  end if;

  get diagnostics v_updated = row_count;

  if p_delta < 0 and v_updated <> 1 then
    raise exception 'insufficient stock for % (%)', p_handle, coalesce(p_label, 'default')
      using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function private.adjust_zuruny_stock(text, text, integer) from public;
grant execute on function private.adjust_zuruny_stock(text, text, integer) to service_role;

create or replace function private.reserve_zuruny_order_item()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.adjust_zuruny_stock(new.product_handle, new.variant_label, -new.qty);
  return new;
end;
$$;

revoke all on function private.reserve_zuruny_order_item() from public;
grant execute on function private.reserve_zuruny_order_item() to service_role;

create or replace function private.release_zuruny_order_item()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Checkout rolls an unfinished order back by deleting it. Children go
  -- first, while the parent is still pending, so the hold is returned.
  -- Paid and failed orders are left alone: paid stock stays sold, and a
  -- failed order already returned its hold below.
  if exists (
    select 1
    from public.zuruny_orders
    where id = old.order_id
      and status = 'pending_payment'
  ) then
    perform private.adjust_zuruny_stock(old.product_handle, old.variant_label, old.qty);
  end if;

  return old;
end;
$$;

revoke all on function private.release_zuruny_order_item() from public;
grant execute on function private.release_zuruny_order_item() to service_role;

create or replace function private.release_zuruny_stock_on_failure()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  line record;
begin
  if old.status = 'pending_payment' and new.status = 'failed' then
    for line in
      select product_handle, variant_label, qty
      from public.zuruny_order_items
      where order_id = new.id
    loop
      perform private.adjust_zuruny_stock(line.product_handle, line.variant_label, line.qty);
    end loop;
  end if;

  return new;
end;
$$;

revoke all on function private.release_zuruny_stock_on_failure() from public;
grant execute on function private.release_zuruny_stock_on_failure() to service_role;

drop trigger if exists zuruny_order_items_reserve_stock on public.zuruny_order_items;
create trigger zuruny_order_items_reserve_stock
  after insert on public.zuruny_order_items
  for each row execute function private.reserve_zuruny_order_item();

drop trigger if exists zuruny_order_items_release_stock on public.zuruny_order_items;
create trigger zuruny_order_items_release_stock
  after delete on public.zuruny_order_items
  for each row execute function private.release_zuruny_order_item();

drop trigger if exists zuruny_orders_release_stock_on_failure on public.zuruny_orders;
create trigger zuruny_orders_release_stock_on_failure
  after update of status on public.zuruny_orders
  for each row execute function private.release_zuruny_stock_on_failure();

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

alter table public.zuruny_profiles enable row level security;
alter table public.zuruny_products enable row level security;
alter table public.zuruny_variants enable row level security;
alter table public.zuruny_product_images enable row level security;
alter table public.zuruny_product_spec enable row level security;
alter table public.zuruny_orders enable row level security;
alter table public.zuruny_order_items enable row level security;

create policy zuruny_profiles_select
  on public.zuruny_profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or (select private.is_zuruny_admin())
  );

create policy zuruny_products_select
  on public.zuruny_products
  for select
  to anon, authenticated
  using (
    status = 'active'
    or (select private.is_zuruny_admin())
  );

create policy zuruny_products_admin_write
  on public.zuruny_products
  for all
  to authenticated
  using ((select private.is_zuruny_admin()))
  with check ((select private.is_zuruny_admin()));

create policy zuruny_variants_select
  on public.zuruny_variants
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.zuruny_products as p
      where p.id = product_id
        and (
          p.status = 'active'
          or (select private.is_zuruny_admin())
        )
    )
  );

create policy zuruny_variants_admin_write
  on public.zuruny_variants
  for all
  to authenticated
  using ((select private.is_zuruny_admin()))
  with check ((select private.is_zuruny_admin()));

create policy zuruny_product_images_select
  on public.zuruny_product_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.zuruny_products as p
      where p.id = product_id
        and (
          p.status = 'active'
          or (select private.is_zuruny_admin())
        )
    )
  );

create policy zuruny_product_images_admin_write
  on public.zuruny_product_images
  for all
  to authenticated
  using ((select private.is_zuruny_admin()))
  with check ((select private.is_zuruny_admin()));

create policy zuruny_product_spec_select
  on public.zuruny_product_spec
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.zuruny_products as p
      where p.id = product_id
        and (
          p.status = 'active'
          or (select private.is_zuruny_admin())
        )
    )
  );

create policy zuruny_product_spec_admin_write
  on public.zuruny_product_spec
  for all
  to authenticated
  using ((select private.is_zuruny_admin()))
  with check ((select private.is_zuruny_admin()));

-- Customers read their own orders. Nobody inserts one from the browser.
create policy zuruny_orders_select
  on public.zuruny_orders
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.is_zuruny_admin())
  );

create policy zuruny_order_items_select
  on public.zuruny_order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.zuruny_orders as o
      where o.id = order_id
        and (
          o.user_id = (select auth.uid())
          or (select private.is_zuruny_admin())
        )
    )
  );

grant select on public.zuruny_products to anon, authenticated;
grant select on public.zuruny_variants to anon, authenticated;
grant select on public.zuruny_product_images to anon, authenticated;
grant select on public.zuruny_product_spec to anon, authenticated;

grant insert, update, delete on public.zuruny_products to authenticated;
grant insert, update, delete on public.zuruny_variants to authenticated;
grant insert, update, delete on public.zuruny_product_images to authenticated;
grant insert, update, delete on public.zuruny_product_spec to authenticated;

grant select on public.zuruny_profiles to authenticated;
grant select on public.zuruny_orders to authenticated;
grant select on public.zuruny_order_items to authenticated;

grant usage, select on sequence public.zuruny_products_id_seq to authenticated;
grant usage, select on sequence public.zuruny_variants_id_seq to authenticated;
grant usage, select on sequence public.zuruny_product_images_id_seq to authenticated;
grant usage, select on sequence public.zuruny_product_spec_id_seq to authenticated;

grant all on public.zuruny_profiles to service_role;
grant all on public.zuruny_products to service_role;
grant all on public.zuruny_variants to service_role;
grant all on public.zuruny_product_images to service_role;
grant all on public.zuruny_product_spec to service_role;
grant all on public.zuruny_orders to service_role;
grant all on public.zuruny_order_items to service_role;

grant usage, select on sequence public.zuruny_products_id_seq to service_role;
grant usage, select on sequence public.zuruny_variants_id_seq to service_role;
grant usage, select on sequence public.zuruny_product_images_id_seq to service_role;
grant usage, select on sequence public.zuruny_product_spec_id_seq to service_role;
grant usage, select on sequence public.zuruny_order_items_id_seq to service_role;
