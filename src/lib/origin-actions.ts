"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { getSessionAdmin } from "@/lib/admin-auth";
import { saveUploadedImage } from "@/lib/uploads";
import { toHandle } from "@/lib/slug";

export type OriginState = { error: string | null; message: string | null };

/** Same boundary as admin-actions.ts and chapter-actions.ts. */
async function requireAdmin(): Promise<boolean> {
  return Boolean(await getSessionAdmin());
}

function refresh() {
  revalidatePath("/", "layout");
}

/** 0–1, since map_x/map_y place the pin directly on the terrain surface. */
function parseUnit(raw: string): number | null {
  const value = Number(raw.trim());
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : null;
}

function parseCoord(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export async function createOrigin(
  _prev: OriginState,
  formData: FormData,
): Promise<OriginState> {
  if (!(await requireAdmin())) return { error: "Not allowed.", message: null };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give the place a name.", message: null };

  const mapX = parseUnit(String(formData.get("map_x") ?? ""));
  const mapY = parseUnit(String(formData.get("map_y") ?? ""));
  if (mapX === null || mapY === null) {
    return { error: "Map X and Map Y must both be between 0 and 1.", message: null };
  }

  const productLabel = String(formData.get("product_label") ?? "").trim();
  if (!productLabel) return { error: "Give the pin a product label.", message: null };

  const productId = Number(formData.get("product_id") ?? "") || null;
  const slug = toHandle(String(formData.get("slug") ?? "") || name);
  if (!slug) return { error: "That makes an empty pin URL.", message: null };

  try {
    await query(
      `insert into zuruny_origins
         (slug, name, region, lat, lng, map_x, map_y, product_id, product_label, note, position)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
               coalesce((select max(position) + 1 from zuruny_origins), 1))`,
      [
        slug,
        name,
        String(formData.get("region") ?? "").trim(),
        parseCoord(String(formData.get("lat") ?? "")),
        parseCoord(String(formData.get("lng") ?? "")),
        mapX,
        mapY,
        productId,
        productLabel,
        String(formData.get("note") ?? "").trim() || null,
      ],
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return { error: `A pin already uses the URL "${slug}".`, message: null };
    }
    return { error: "Could not add that pin.", message: null };
  }

  refresh();
  return { error: null, message: `Added "${name}" to the map.` };
}

export async function updateOrigin(
  _prev: OriginState,
  formData: FormData,
): Promise<OriginState> {
  if (!(await requireAdmin())) return { error: "Not allowed.", message: null };

  const id = Number(formData.get("id") ?? "");
  if (!id) return { error: "Could not find that pin.", message: null };

  const mapX = parseUnit(String(formData.get("map_x") ?? ""));
  const mapY = parseUnit(String(formData.get("map_y") ?? ""));
  if (mapX === null || mapY === null) {
    return { error: "Map X and Map Y must both be between 0 and 1.", message: null };
  }

  const name = String(formData.get("name") ?? "").trim();
  const productLabel = String(formData.get("product_label") ?? "").trim();
  if (!name || !productLabel) {
    return { error: "The name and the product label can't be empty.", message: null };
  }

  const productId = Number(formData.get("product_id") ?? "") || null;

  try {
    await query(
      `update zuruny_origins
          set name = $1, region = $2, lat = $3, lng = $4, map_x = $5, map_y = $6,
              product_id = $7, product_label = $8, note = $9
        where id = $10`,
      [
        name,
        String(formData.get("region") ?? "").trim(),
        parseCoord(String(formData.get("lat") ?? "")),
        parseCoord(String(formData.get("lng") ?? "")),
        mapX,
        mapY,
        productId,
        productLabel,
        String(formData.get("note") ?? "").trim() || null,
        id,
      ],
    );
  } catch {
    return { error: "Could not save that change.", message: null };
  }

  refresh();
  return { error: null, message: "Saved." };
}

export async function deleteOrigin(
  _prev: OriginState,
  formData: FormData,
): Promise<OriginState> {
  if (!(await requireAdmin())) return { error: "Not allowed.", message: null };

  const id = Number(formData.get("id") ?? "");
  if (!id) return { error: "Could not find that pin.", message: null };

  await query("delete from zuruny_origins where id = $1", [id]);

  refresh();
  return { error: null, message: "Removed from the map." };
}

export async function uploadOriginImage(
  _prev: OriginState,
  formData: FormData,
): Promise<OriginState> {
  if (!(await requireAdmin())) return { error: "Not allowed.", message: null };

  const id = Number(formData.get("id") ?? "");
  if (!id) return { error: "Could not find that pin.", message: null };

  const file = formData.get("image");
  if (!(file instanceof File)) return { error: "Choose an image.", message: null };

  const result = await saveUploadedImage(file, "origins");
  if (!result.ok) return { error: result.error, message: null };

  await query("update zuruny_origins set image = $1 where id = $2", [result.src, id]);

  refresh();
  return { error: null, message: "Image updated." };
}
