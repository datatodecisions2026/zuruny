import { writeFileSync } from "node:fs";
import { products } from "../src/lib/catalog.ts";

const payload = products.map((product, position) => ({
  handle: product.handle,
  name: product.name,
  kind: product.kind,
  status: product.status,
  named_after_from: product.namedAfterFrom ?? null,
  description: product.description,
  description_fr: product.descriptionFr ?? null,
  memory: product.memory ?? null,
  pull_quote: product.pullQuote ?? null,
  position,
  variants: product.variants.map((variant, index) => ({
    label: variant.label,
    price_cents: variant.priceCents,
    stock: variant.stock,
    available: variant.available,
    position: index,
  })),
  images: product.images.map((image, index) => ({
    src: image.src,
    width: image.w,
    height: image.h,
    alt: image.alt,
    position: index,
  })),
  spec: product.spec.map((item, index) => ({
    label: item.label,
    value: item.value,
    label_fr: item.labelFr ?? null,
    value_fr: item.valueFr ?? null,
    position: index,
  })),
}));

const json = JSON.stringify(payload);
const delimiter = "$zuruny_catalogue$";
if (json.includes(delimiter)) {
  throw new Error("seed delimiter appears in catalogue text");
}

const sql = `-- Catalogue seed, generated from src/lib/catalog.ts.
-- Regenerate with: node scripts/render-catalogue-seed.mjs
-- Safe to run again: products that already exist are left untouched,
-- including any price or stock an admin has changed.

with incoming as (
  select *
  from jsonb_to_recordset(${delimiter}${json}${delimiter}::jsonb) as p (
    handle text,
    name text,
    kind text,
    status text,
    named_after_from text,
    description text,
    description_fr text,
    memory text,
    pull_quote text,
    position integer,
    variants jsonb,
    images jsonb,
    spec jsonb
  )
),
inserted as (
  insert into public.zuruny_products (
    handle, name, kind, status, named_after_from, description, description_fr,
    memory, pull_quote, position
  )
  select
    handle, name, kind, status, named_after_from, description, description_fr,
    memory, pull_quote, position
  from incoming
  on conflict (handle) do nothing
  returning id, handle
),
variants as (
  insert into public.zuruny_variants (
    product_id, label, price_cents, stock, available, position
  )
  select
    i.id,
    v.label,
    v.price_cents,
    v.stock,
    v.available,
    v.position
  from inserted as i
  join incoming as p on p.handle = i.handle
  cross join lateral jsonb_to_recordset(p.variants) as v (
    label text,
    price_cents integer,
    stock integer,
    available boolean,
    position integer
  )
  returning 1
),
images as (
  insert into public.zuruny_product_images (
    product_id, src, width, height, alt, position
  )
  select
    i.id,
    img.src,
    img.width,
    img.height,
    img.alt,
    img.position
  from inserted as i
  join incoming as p on p.handle = i.handle
  cross join lateral jsonb_to_recordset(p.images) as img (
    src text,
    width integer,
    height integer,
    alt text,
    position integer
  )
  returning 1
)
insert into public.zuruny_product_spec (
  product_id, label, value, label_fr, value_fr, position
)
select
  i.id,
  s.label,
  s.value,
  s.label_fr,
  s.value_fr,
  s.position
from inserted as i
join incoming as p on p.handle = i.handle
cross join lateral jsonb_to_recordset(p.spec) as s (
  label text,
  value text,
  label_fr text,
  value_fr text,
  position integer
);
`;

writeFileSync(
  new URL("../supabase/migrations/20260928110001_zuruny_catalogue_seed.sql", import.meta.url),
  sql,
);
console.log(`wrote catalogue seed (${products.length} products)`);
