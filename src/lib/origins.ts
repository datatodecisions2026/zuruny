import "server-only";
import { cache } from "react";
import { dbConfigured, query } from "@/lib/db";
import { origins as seedOrigins, type LebanonOrigin } from "@/data/lebanon-origins";

/**
 * Pins on the shop's 3D relief map, read from Postgres.
 *
 * Falls back to the seed file the same way products.ts does: if the database
 * isn't configured or the read fails, the map still renders its 5 original
 * pins rather than going blank.
 */

type Row = {
  slug: string;
  name: string;
  region: string;
  lat: number | null;
  lng: number | null;
  map_x: number;
  map_y: number;
  product_handle: string | null;
  product_label: string;
  image: string | null;
  note: string | null;
};

function toOrigin(row: Row): LebanonOrigin {
  return {
    id: row.slug,
    name: row.name,
    region: row.region,
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    mapX: row.map_x,
    mapY: row.map_y,
    product: row.product_label,
    productHandle: row.product_handle ?? "",
    href: `#${row.slug}`,
    image: row.image ?? undefined,
    note: row.note ?? undefined,
  };
}

export type AdminOrigin = {
  id: number;
  slug: string;
  name: string;
  region: string;
  lat: number | null;
  lng: number | null;
  mapX: number;
  mapY: number;
  productId: number | null;
  productLabel: string;
  image: string | null;
  note: string | null;
};

/** For the admin editor: every pin, plus the raw id/product_id an edit form needs. */
export async function getAdminOrigins(): Promise<AdminOrigin[]> {
  const rows = await query<{
    id: number;
    slug: string;
    name: string;
    region: string;
    lat: number | null;
    lng: number | null;
    map_x: number;
    map_y: number;
    product_id: number | null;
    product_label: string;
    image: string | null;
    note: string | null;
  }>(
    `select id, slug, name, region, lat, lng, map_x, map_y, product_id, product_label, image, note
       from zuruny_origins order by position`,
  );

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    region: r.region,
    lat: r.lat,
    lng: r.lng,
    mapX: r.map_x,
    mapY: r.map_y,
    productId: r.product_id,
    productLabel: r.product_label,
    image: r.image,
    note: r.note,
  }));
}

/** Every product, for the pin's "which product does this point at" picker. */
export async function getOriginProductChoices(): Promise<{ id: number; handle: string; name: string }[]> {
  return query("select id, handle, name from zuruny_products order by name");
}

export const getOrigins = cache(async (): Promise<LebanonOrigin[]> => {
  if (!dbConfigured) return seedOrigins;

  try {
    const rows = await query<Row>(
      `select o.slug, o.name, o.region, o.lat, o.lng, o.map_x, o.map_y,
              p.handle as product_handle, o.product_label, o.image, o.note
         from zuruny_origins o
         left join zuruny_products p on p.id = o.product_id
        order by o.position`,
    );
    return rows.map(toOrigin);
  } catch (error) {
    console.error(
      "[zuruny] Falling back to the seed map pins — the database read failed:",
      error instanceof Error ? error.message : error,
    );
    return seedOrigins;
  }
});
