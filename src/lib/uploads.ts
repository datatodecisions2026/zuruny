import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { imageSize } from "image-size";

const EXT_FOR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_BYTES = 8 * 1024 * 1024;

export type UploadResult =
  | { ok: true; src: string; width: number; height: number }
  | { ok: false; error: string };

/**
 * Saves an admin-uploaded image to disk under public/, so it's served the
 * same way every other product photo already is — no cloud storage.
 *
 * `folder` must come from the caller, never from user input, since it is
 * joined into a filesystem path.
 *
 * The MIME type from the browser is easy to fake, so the real check is
 * `imageSize()`: it reads the file's actual header bytes, and throws on
 * anything that isn't one of these three formats.
 */
export async function saveUploadedImage(file: File, folder: string): Promise<UploadResult> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image." };
  if (file.size > MAX_BYTES) return { ok: false, error: "That image is larger than 8 MB." };

  const ext = EXT_FOR_MIME[file.type];
  if (!ext) return { ok: false, error: "Use a JPEG, PNG or WebP image." };

  const bytes = new Uint8Array(await file.arrayBuffer());

  let width: number | undefined, height: number | undefined;
  try {
    ({ width, height } = imageSize(bytes));
  } catch {
    return { ok: false, error: "That file isn't a readable image." };
  }
  if (!width || !height) return { ok: false, error: "That file isn't a readable image." };

  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);

  return { ok: true, src: `/uploads/${folder}/${name}`, width, height };
}
