"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSignedIn, signIn, signOut } from "@/lib/admin-auth";
import {
  insertImage,
  insertProduct,
  patchProduct,
  removeImage,
  removeProduct,
  removeVariant,
  upsertVariant,
} from "@/lib/store";

async function assertSignedIn() {
  if (!(await isSignedIn())) throw new Error("Not signed in.");
}

/** Refresh every surface that reads the catalogue. */
function revalidateStorefront(handle?: string) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin");
  if (handle) {
    revalidatePath(`/products/${handle}`);
    revalidatePath(`/admin/${handle}`);
  }
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const text = (v: FormDataEntryValue | null) => {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
};

export async function login(_prev: string | null, formData: FormData) {
  const ok = await signIn((formData.get("password") ?? "").toString());
  if (!ok) return "That password did not match.";
  redirect("/admin");
}

export async function logout() {
  await signOut();
  redirect("/admin");
}

export async function createProduct(_prev: string | null, formData: FormData) {
  await assertSignedIn();
  const title = (formData.get("title") ?? "").toString().trim();
  if (!title) return "A product needs a name.";

  const handle = slug((formData.get("handle") ?? "").toString() || title);
  const { handle: created, error } = await insertProduct({
    handle,
    title,
    kind: (formData.get("kind") ?? "Olive oil").toString(),
  });
  if (error) return error;

  revalidateStorefront(created);
  redirect(`/admin/${created}`);
}

export async function updateProduct(_prev: string | null, formData: FormData) {
  await assertSignedIn();

  const specRaw = (formData.get("spec") ?? "").toString().trim();
  const spec = specRaw
    .split("\n")
    .map((line) => line.split(":"))
    .filter((parts) => parts.length >= 2 && parts[0].trim())
    .map((parts) => ({
      label: parts[0].trim(),
      value: parts.slice(1).join(":").trim(),
    }));

  const { handle, error } = await patchProduct(Number(formData.get("id")), {
    title: (formData.get("title") ?? "").toString().trim(),
    kind: (formData.get("kind") ?? "").toString(),
    status: (formData.get("status") ?? "draft").toString() as
      | "draft"
      | "active"
      | "archived",
    village: text(formData.get("village")),
    description: text(formData.get("description")),
    story: text(formData.get("story")),
    pull_quote: text(formData.get("pull_quote")),
    spec,
  });

  if (error) return error;
  revalidateStorefront(handle);
  return "Saved.";
}

export async function deleteProduct(formData: FormData) {
  await assertSignedIn();
  await removeProduct(Number(formData.get("id")));
  revalidateStorefront();
  redirect("/admin");
}

export async function saveVariant(_prev: string | null, formData: FormData) {
  await assertSignedIn();
  const handle = (formData.get("handle") ?? "").toString();

  const price = Number(formData.get("price") ?? 0);
  if (Number.isNaN(price) || price < 0) return "Price must be a number.";

  const { error } = await upsertVariant(Number(formData.get("product_id")), {
    id: formData.get("id") ? Number(formData.get("id")) : null,
    title: (formData.get("title") ?? "Default").toString().trim() || "Default",
    // Integer cents, so no float rounding can creep into money.
    price_cents: Math.round(price * 100),
    inventory: Math.max(0, Number(formData.get("inventory") ?? 0) || 0),
    available: formData.get("available") === "on",
    position: Number(formData.get("position") ?? 0) || 0,
  });

  if (error) return error;
  revalidateStorefront(handle);
  return "Saved.";
}

export async function deleteVariant(formData: FormData) {
  await assertSignedIn();
  await removeVariant(Number(formData.get("id")));
  revalidateStorefront((formData.get("handle") ?? "").toString());
}

export async function addImage(_prev: string | null, formData: FormData) {
  await assertSignedIn();
  const url = (formData.get("url") ?? "").toString().trim();
  if (!url) return "Paste an image address first.";

  const { error } = await insertImage(Number(formData.get("product_id")), {
    url,
    alt: text(formData.get("alt")),
    position: Number(formData.get("position") ?? 0) || 0,
  });

  if (error) return error;
  revalidateStorefront((formData.get("handle") ?? "").toString());
  return "Added.";
}

export async function deleteImage(formData: FormData) {
  await assertSignedIn();
  await removeImage(Number(formData.get("id")));
  revalidateStorefront((formData.get("handle") ?? "").toString());
}
