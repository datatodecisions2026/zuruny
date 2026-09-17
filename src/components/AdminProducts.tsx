"use client";

import { useActionState, useState } from "react";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  type AdminState,
} from "@/lib/admin-actions";
import { formatUSD } from "@/lib/catalog";

const EMPTY: AdminState = { error: null, message: null };

export type AdminProduct = {
  id: number;
  handle: string;
  name: string;
  kind: string;
  status: string;
  description: string;
  descriptionFr: string;
  variantId: number | null;
  priceCents: number | null;
  stock: number;
};

const KINDS = [
  ["olive-oil", "Olive oil"],
  ["carob-molasses", "Carob molasses"],
  ["grape-molasses", "Grape molasses"],
  ["carafe", "Carafe"],
  ["coaster", "Coaster"],
] as const;

export function AdminProducts({ products }: { products: AdminProduct[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="u-mono text-[var(--text-faint)]">
          {products.length} products &middot;{" "}
          {products.filter((p) => p.status === "active").length} published
        </p>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="u-mono border border-[var(--rule-strong)] px-5 py-3 text-cream transition-colors duration-300 hover:border-ochre hover:text-ochre"
        >
          {adding ? "Cancel" : "Add product"}
        </button>
      </div>

      {adding && <AddForm />}

      <ul className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
        {products.map((product) => (
          <li key={product.handle}>
            <div className="flex flex-wrap items-center gap-4 py-4">
              <button
                type="button"
                onClick={() =>
                  setOpen(open === product.handle ? null : product.handle)
                }
                aria-expanded={open === product.handle}
                className="flex-1 text-left"
              >
                <span className="u-display text-[length:var(--step-1)] text-cream">
                  {product.name}
                </span>
                <span className="u-mono ml-3 text-[var(--text-faint)]">
                  /{product.handle}
                </span>
              </button>

              <span
                className={`u-mono px-3 py-1 ${
                  product.status === "active"
                    ? "text-ochre"
                    : "text-[var(--text-faint)]"
                }`}
              >
                {product.status === "active" ? "Published" : "Draft"}
              </span>

              <span className="u-mono w-24 text-right text-cream">
                {product.priceCents === null
                  ? "—"
                  : formatUSD(product.priceCents)}
              </span>

              <span
                className={`u-mono w-20 text-right ${
                  product.stock > 0 ? "text-cream" : "text-ochre"
                }`}
              >
                {product.stock > 0 ? `${product.stock} in stock` : "0"}
              </span>
            </div>

            {open === product.handle && (
              <EditForm product={product} onDone={() => setOpen(null)} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddForm() {
  const [state, action, pending] = useActionState(createProduct, EMPTY);
  /* The form stays open after a successful add and reports it, rather than
     closing itself: setting state during render to auto-close causes a
     cascading render, and the owner usually adds more than one product. */

  return (
    <form
      action={action}
      className="mb-8 grid gap-5 border border-[var(--rule-strong)] p-6 sm:grid-cols-2"
    >
      <Field name="name" label="Name" required />
      <Select name="kind" label="Kind" options={KINDS} />
      <Field name="price" label="Price in USD (Lebanon base)" placeholder="28.00" />
      <Field name="stock" label="Stock" type="number" placeholder="0" />
      <Field name="description" label="Description" textarea span />
      <Field name="description_fr" label="Description (French)" textarea span />
      <Status state={state} />
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="u-mono bg-cream px-7 py-4 text-ground transition-colors duration-300 hover:bg-ochre disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add as draft"}
        </button>
        <p className="u-mono mt-3 text-[var(--text-faint)]">
          New products start as drafts and stay off the shop until published.
        </p>
      </div>
    </form>
  );
}

function EditForm({
  product,
  onDone,
}: {
  product: AdminProduct;
  onDone: () => void;
}) {
  const [saveState, saveAction, saving] = useActionState(updateProduct, EMPTY);
  const [delState, delAction, deleting] = useActionState(deleteProduct, EMPTY);

  return (
    <div className="mb-6 border border-[var(--rule)] p-6">
      <form action={saveAction} className="grid gap-5 sm:grid-cols-2">
        <input type="hidden" name="handle" value={product.handle} />
        <input type="hidden" name="variant_id" value={product.variantId ?? ""} />

        <Field name="name" label="Name" defaultValue={product.name} required />
        <Select
          name="status"
          label="Status"
          defaultValue={product.status}
          options={[
            ["draft", "Draft — hidden from the shop"],
            ["active", "Published — visible to everyone"],
          ]}
        />
        <Field
          name="price"
          label="Price in USD (Lebanon base)"
          defaultValue={
            product.priceCents === null
              ? ""
              : (product.priceCents / 100).toFixed(2)
          }
          placeholder="Leave blank for no price"
        />
        <Field
          name="stock"
          label="Stock"
          type="number"
          defaultValue={String(product.stock)}
        />
        <Field
          name="description"
          label="Description"
          textarea
          span
          defaultValue={product.description}
        />
        <Field
          name="description_fr"
          label="Description (French)"
          textarea
          span
          defaultValue={product.descriptionFr}
        />

        <Status state={saveState} />

        <div className="flex gap-4 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="u-mono bg-cream px-7 py-4 text-ground transition-colors duration-300 hover:bg-ochre disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="u-mono px-4 py-4 text-[var(--text-muted)] transition-colors hover:text-cream"
          >
            Close
          </button>
        </div>
      </form>

      <form
        action={delAction}
        className="mt-8 border-t border-[var(--rule)] pt-6"
      >
        <input type="hidden" name="handle" value={product.handle} />
        <p className="u-mono mb-3 text-[var(--text-faint)]">
          Deleting removes the product, its photographs and its spec. This
          cannot be undone &mdash; type{" "}
          <span className="text-ochre">{product.handle}</span> to confirm.
        </p>
        <div className="flex flex-wrap gap-4">
          <input
            name="confirm"
            aria-label={`Type ${product.handle} to confirm deletion`}
            className="flex-1 border border-[var(--rule-strong)] bg-ground-2 px-4 py-3 text-cream outline-none focus:border-ochre"
          />
          <button
            type="submit"
            disabled={deleting}
            className="u-mono border border-oxblood px-6 py-3 text-ochre transition-colors duration-300 hover:bg-oxblood disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
        <Status state={delState} />
      </form>
    </div>
  );
}

function Status({ state }: { state: AdminState }) {
  if (!state.error && !state.message) return null;
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={`u-mono sm:col-span-2 ${
        state.error ? "text-ochre" : "text-[var(--text-muted)]"
      }`}
    >
      {state.error ?? state.message}
    </p>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  placeholder,
  required,
  textarea,
  span,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  textarea?: boolean;
  span?: boolean;
}) {
  const cls =
    "w-full border border-[var(--rule-strong)] bg-ground-2 px-4 py-3 text-cream outline-none transition-colors duration-300 focus:border-ochre";
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <label htmlFor={name} className="u-mono mb-2 block text-[var(--text-muted)]">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          rows={3}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={cls}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          className={cls}
        />
      )}
    </div>
  );
}

function Select({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: readonly (readonly [string, string])[];
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="u-mono mb-2 block text-[var(--text-muted)]">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="w-full border border-[var(--rule-strong)] bg-ground-2 px-4 py-3 text-cream outline-none focus:border-ochre"
      >
        {options.map(([value, text]) => (
          <option key={value} value={value} className="bg-ground">
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}
