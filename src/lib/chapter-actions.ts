"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { getSessionAdmin } from "@/lib/admin-auth";
import { saveUploadedImage } from "@/lib/uploads";
import { toHandle } from "@/lib/slug";

export type ChapterState = { error: string | null; message: string | null };

/** Same boundary as admin-actions.ts: every action starts here, there is no RLS behind it. */
async function requireAdmin(): Promise<boolean> {
  return Boolean(await getSessionAdmin());
}

function refresh() {
  // The book pulls from the same product data as the shop, so revalidate both.
  revalidatePath("/", "layout");
}

export async function createChapter(
  _prev: ChapterState,
  formData: FormData,
): Promise<ChapterState> {
  if (!(await requireAdmin())) return { error: "Not allowed.", message: null };

  const productId = Number(formData.get("product_id") ?? "");
  if (!productId) return { error: "Choose a product.", message: null };

  const [product] = await query<{ handle: string; memory: string | null }>(
    "select handle, memory from zuruny_products where id = $1",
    [productId],
  );
  if (!product) return { error: "That product no longer exists.", message: null };
  if (!product.memory?.trim()) {
    return { error: "That product has no story yet — add one on the Products page first.", message: null };
  }

  const slug = toHandle(String(formData.get("slug") ?? "") || product.handle);
  if (!slug) return { error: "That makes an empty chapter URL.", message: null };
  const allowDraft = formData.get("allow_draft") === "on";

  try {
    await query(
      `insert into zuruny_chapters (product_id, slug, allow_draft, position)
       values ($1, $2, $3, coalesce((select max(position) + 1 from zuruny_chapters), 1))`,
      [productId, slug, allowDraft],
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return { error: "That product or that chapter URL is already in the book.", message: null };
    }
    return { error: "Could not add that chapter.", message: null };
  }

  refresh();
  return { error: null, message: "Added to the book. Now upload a dedication image below." };
}

export async function deleteChapter(
  _prev: ChapterState,
  formData: FormData,
): Promise<ChapterState> {
  if (!(await requireAdmin())) return { error: "Not allowed.", message: null };

  const id = Number(formData.get("chapter_id") ?? "");
  if (!id) return { error: "Could not find that chapter.", message: null };

  // Uploaded files are left on disk — orphaned, not linked from anywhere —
  // rather than deleted, since a delete here can't be undone either way.
  await query("delete from zuruny_chapters where id = $1", [id]);

  refresh();
  return { error: null, message: "Removed from the book." };
}

const KIND_LABEL: Record<string, string> = {
  dedication: "dedication",
  product: "product",
  place: "place",
  portrait: "portrait",
  detail: "detail",
};

export async function uploadChapterImage(
  _prev: ChapterState,
  formData: FormData,
): Promise<ChapterState> {
  if (!(await requireAdmin())) return { error: "Not allowed.", message: null };

  const chapterId = Number(formData.get("chapter_id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  if (!chapterId || !(kind in KIND_LABEL)) return { error: "Something went wrong.", message: null };

  const [chapter] = await query<{ slug: string }>(
    "select slug from zuruny_chapters where id = $1",
    [chapterId],
  );
  if (!chapter) return { error: "That chapter no longer exists.", message: null };

  const file = formData.get("image");
  if (!(file instanceof File)) return { error: "Choose an image.", message: null };

  const result = await saveUploadedImage(file, `names/${chapter.slug}`);
  if (!result.ok) return { error: result.error, message: null };

  const alt = String(formData.get("alt") ?? "").trim();
  await query(
    `insert into zuruny_chapter_images (chapter_id, kind, src, width, height, alt, position)
     values ($1, $2, $3, $4, $5, $6, coalesce((select max(position) + 1 from zuruny_chapter_images where chapter_id = $1), 0))`,
    [chapterId, kind, result.src, result.width, result.height, alt],
  );

  refresh();
  return { error: null, message: `Added the ${KIND_LABEL[kind]} image.` };
}

export async function deleteChapterImage(
  _prev: ChapterState,
  formData: FormData,
): Promise<ChapterState> {
  if (!(await requireAdmin())) return { error: "Not allowed.", message: null };

  const id = Number(formData.get("image_id") ?? "");
  if (!id) return { error: "Could not find that image.", message: null };

  // The file stays on disk — deleting it too risks a race with a request
  // still serving it, and it costs nothing to leave an unreferenced file.
  await query("delete from zuruny_chapter_images where id = $1", [id]);

  refresh();
  return { error: null, message: "Removed." };
}
