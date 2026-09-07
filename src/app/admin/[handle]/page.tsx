import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductRow } from "@/lib/store";
import { isSignedIn } from "@/lib/admin-auth";
import {
  addImage,
  deleteImage,
  deleteProduct,
  deleteVariant,
  saveVariant,
  updateProduct,
} from "../actions";
import { ActionForm, Area, Field, Select, Submit } from "@/components/admin/Ui";

export const metadata: Metadata = { title: "Edit — Zuruny", robots: "noindex" };
export const dynamic = "force-dynamic";

export default async function EditProduct({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  if (!(await isSignedIn())) notFound();

  const p = await getProductRow(handle);
  if (!p) notFound();
  const variants = p.variants;
  const images = p.images;
  const specText = p.spec
    .map((s) => `${s.label}: ${s.value}`)
    .join("\n");

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:px-10">
      <Link
        href="/admin"
        className="text-sm tracking-[0.12em] text-char-soft underline decoration-bronze/30 underline-offset-8 hover:text-char"
      >
        All products
      </Link>

      <h1 className="u-display mt-6 text-[clamp(2rem,5vw,3rem)] text-char">
        {p.title}
      </h1>
      <p className="u-spec mt-1 text-char-soft">/products/{p.handle}</p>

      <div className="u-rule my-8" />

      <ActionForm action={updateProduct} className="space-y-6">
        <input type="hidden" name="id" value={p.id} />
        <div className="grid gap-6 sm:grid-cols-3">
          <Field label="Name" name="title" defaultValue={p.title} />
          <Select
            label="Kind"
            name="kind"
            defaultValue={p.kind}
            options={[
              "Olive oil",
              "Carob molasses",
              "Grape molasses",
              "Carafe",
              "Coaster",
            ]}
          />
          <Select
            label="Status"
            name="status"
            defaultValue={p.status}
            options={["draft", "active", "archived"]}
          />
        </div>
        <Field label="Village" name="village" defaultValue={p.village} />
        <Area
          label="Description"
          name="description"
          defaultValue={p.description}
          rows={5}
        />
        <Area
          label="The story"
          name="story"
          defaultValue={p.story}
          rows={7}
          hint="Shown on the product page under “Why it carries this name”."
        />
        <Area
          label="Pull quote"
          name="pull_quote"
          defaultValue={p.pull_quote}
          rows={2}
          hint="One line, shown on the homepage."
        />
        <Area
          label="Spec strip"
          name="spec"
          defaultValue={specText}
          rows={5}
          hint="One per line, as “Label: value”."
        />
        <Submit>Save product</Submit>
      </ActionForm>

      <div className="u-rule my-10" />

      <h2 className="u-display text-xl text-char">Sizes and prices</h2>
      <div className="mt-5 space-y-4">
        {variants.map((v) => (
          <ActionForm
            key={v.id}
            action={saveVariant}
            className="grid items-end gap-4 border border-bronze/20 bg-card p-4 sm:grid-cols-[1fr_7rem_7rem_auto_auto]"
          >
            <input type="hidden" name="id" value={v.id} />
            <input type="hidden" name="product_id" value={p.id} />
            <input type="hidden" name="handle" value={p.handle} />
            <input type="hidden" name="position" value={v.position} />
            <Field label="Size" name="title" defaultValue={v.title} />
            <Field
              label="Price"
              name="price"
              type="number"
              defaultValue={(v.price_cents / 100).toFixed(2)}
            />
            <Field
              label="Stock"
              name="inventory"
              type="number"
              defaultValue={v.inventory}
            />
            <label className="flex items-center gap-2 pb-3">
              <input
                type="checkbox"
                name="available"
                defaultChecked={v.available}
              />
              <span className="u-spec text-char-soft">For sale</span>
            </label>
            <Submit>Save</Submit>
          </ActionForm>
        ))}

        {variants.map((v) => (
          <form key={`del-${v.id}`} action={deleteVariant}>
            <input type="hidden" name="id" value={v.id} />
            <input type="hidden" name="handle" value={p.handle} />
            <button className="u-spec text-char-soft underline decoration-bronze/30 underline-offset-4 hover:text-oxblood">
              Remove “{v.title}”
            </button>
          </form>
        ))}
      </div>

      <ActionForm
        action={saveVariant}
        className="mt-6 grid items-end gap-4 border border-dashed border-bronze/40 p-4 sm:grid-cols-[1fr_7rem_7rem_auto]"
      >
        <input type="hidden" name="product_id" value={p.id} />
        <input type="hidden" name="handle" value={p.handle} />
        <input type="hidden" name="position" value={variants.length} />
        <Field label="New size" name="title" placeholder="1 L" />
        <Field label="Price" name="price" type="number" placeholder="0.00" />
        <Field label="Stock" name="inventory" type="number" placeholder="0" />
        <Submit>Add size</Submit>
      </ActionForm>

      <div className="u-rule my-10" />

      <h2 className="u-display text-xl text-char">Photographs</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-4">
        {images.map((img) => (
          <div key={img.id} className="border border-bronze/20 bg-card p-2">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-paper-deep">
              <Image
                src={img.url}
                alt={img.alt ?? ""}
                fill
                sizes="200px"
                className="object-cover"
              />
            </div>
            <form action={deleteImage} className="mt-2">
              <input type="hidden" name="id" value={img.id} />
              <input type="hidden" name="handle" value={p.handle} />
              <button className="u-spec text-char-soft hover:text-oxblood">
                Remove
              </button>
            </form>
          </div>
        ))}
      </div>

      <ActionForm action={addImage} className="mt-6 max-w-xl space-y-4">
        <input type="hidden" name="product_id" value={p.id} />
        <input type="hidden" name="handle" value={p.handle} />
        <input type="hidden" name="position" value={images.length} />
        <Field
          label="Image address"
          name="url"
          placeholder="/products/najibe-4.png"
          hint="A path in /public, or any https:// URL on an allowed host."
        />
        <Field label="Alt text" name="alt" placeholder="Najibe, olive oil" />
        <Submit>Add photograph</Submit>
      </ActionForm>

      <div className="u-rule my-10" />

      <form action={deleteProduct}>
        <input type="hidden" name="id" value={p.id} />
        <button className="border border-oxblood/40 px-5 py-2.5 text-sm tracking-[0.14em] text-oxblood transition-colors hover:bg-oxblood hover:text-paper">
          Delete this product
        </button>
      </form>
    </div>
  );
}
