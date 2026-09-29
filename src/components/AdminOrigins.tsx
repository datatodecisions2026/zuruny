"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import {
  createOrigin,
  updateOrigin,
  deleteOrigin,
  uploadOriginImage,
  type OriginState,
} from "@/lib/origin-actions";
import type { AdminOrigin } from "@/lib/origins";

const EMPTY: OriginState = { error: null, message: null };

type ProductChoice = { id: number; handle: string; name: string };

export function AdminOrigins({ origins, products }: { origins: AdminOrigin[]; products: ProductChoice[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="u-mono text-muted-foreground">
          {origins.length} {origins.length === 1 ? "pin" : "pins"} on the map
        </p>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="u-mono border border-input px-5 py-3 text-foreground transition-colors duration-300 hover:border-accent hover:text-accent"
        >
          {adding ? "Cancel" : "Add a pin"}
        </button>
      </div>

      {adding && <OriginForm products={products} onDone={() => setAdding(false)} />}

      <ul className="divide-y divide-border border-y border-border">
        {origins.map((origin) => (
          <li key={origin.id}>
            <div className="flex flex-wrap items-center gap-4 py-4">
              <button
                type="button"
                onClick={() => setOpen(open === origin.id ? null : origin.id)}
                aria-expanded={open === origin.id}
                className="flex-1 text-left"
              >
                <span className="u-display text-[length:var(--step-1)] text-foreground">{origin.name}</span>
                <span className="u-mono ml-3 text-muted-foreground">{origin.productLabel}</span>
              </button>
              <span className="u-mono w-32 text-right text-muted-foreground">
                x {origin.mapX.toFixed(3)} · y {origin.mapY.toFixed(3)}
              </span>
            </div>
            {open === origin.id && (
              <div className="mb-6 border border-border p-6">
                <OriginForm origin={origin} products={products} onDone={() => setOpen(null)} />
                <ImageForm origin={origin} />
                <DeleteForm origin={origin} onDone={() => setOpen(null)} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OriginForm({
  origin,
  products,
  onDone,
}: {
  origin?: AdminOrigin;
  products: ProductChoice[];
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(origin ? updateOrigin : createOrigin, EMPTY);

  /* Only close on a confirmed success (the next render after the action
     resolves) — closing from the click handler itself would read the state
     from before submission and hide a rejected entry's error. */
  useEffect(() => {
    if (!origin && state.message && !state.error) onDone();
  }, [state, origin, onDone]);

  return (
    <form
      action={action}
      className={origin ? "grid gap-5 sm:grid-cols-2" : "mb-8 grid gap-5 border border-input p-6 sm:grid-cols-2"}
    >
      {origin && <input type="hidden" name="id" value={origin.id} />}
      <Field name="name" label="Place name" defaultValue={origin?.name} required />
      {!origin && (
        <Field name="slug" label="Pin URL" placeholder="Leave blank to use the place name" />
      )}
      <Field name="region" label="Region" defaultValue={origin?.region} />
      <div>
        <label htmlFor={`${origin?.id ?? "new"}-product`} className="u-mono mb-2 block text-muted-foreground">
          Product
        </label>
        <select
          id={`${origin?.id ?? "new"}-product`}
          name="product_id"
          defaultValue={origin?.productId ?? ""}
          className="w-full border border-input bg-muted px-4 py-3 text-foreground outline-none focus:border-accent"
        >
          <option value="" className="bg-card">No product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id} className="bg-card">{p.name}</option>
          ))}
        </select>
        <p className="u-mono mt-2 text-muted-foreground">
          May point at a draft product — the pin still shows, only its &ldquo;view&rdquo; link is hidden.
        </p>
      </div>
      <Field
        name="product_label"
        label="Pin label"
        defaultValue={origin?.productLabel}
        placeholder="Shown on the pin itself, e.g. the product name"
        required
      />
      <Field
        name="map_x"
        label="Map X (0–1)"
        defaultValue={origin?.mapX?.toFixed(6)}
        placeholder="0.352296"
        required
      />
      <Field
        name="map_y"
        label="Map Y (0–1)"
        defaultValue={origin?.mapY?.toFixed(6)}
        placeholder="0.546742"
        required
      />
      <Field name="lat" label="Latitude (shown as text only)" defaultValue={origin?.lat?.toString()} />
      <Field name="lng" label="Longitude (shown as text only)" defaultValue={origin?.lng?.toString()} />
      <Field name="note" label="Note (fallback text if there's no product)" defaultValue={origin?.note ?? undefined} textarea span />

      {(state.error || state.message) && (
        <p role={state.error ? "alert" : "status"} className={`u-mono sm:col-span-2 ${state.error ? "text-accent" : "text-muted-foreground"}`}>
          {state.error ?? state.message}
        </p>
      )}

      <div className="flex gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="u-mono bg-primary px-7 py-4 text-primary-foreground transition-colors duration-300 hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : origin ? "Save" : "Add pin"}
        </button>
        {origin && (
          <button type="button" onClick={onDone} className="u-mono px-4 py-4 text-muted-foreground transition-colors hover:text-foreground">
            Close
          </button>
        )}
      </div>
    </form>
  );
}

function ImageForm({ origin }: { origin: AdminOrigin }) {
  const [state, action, pending] = useActionState(uploadOriginImage, EMPTY);
  return (
    <form action={action} className="mt-8 border-t border-border pt-6">
      <input type="hidden" name="id" value={origin.id} />
      <p className="u-mono mb-3 text-muted-foreground">
        Fallback illustration, used when the linked product has no photo of its own.
      </p>
      <div className="flex flex-wrap items-end gap-4">
        {origin.image && (
          <div className="relative aspect-[3/4] w-20 overflow-hidden border border-input bg-muted">
            <Image src={origin.image} alt="" fill sizes="80px" className="object-cover" />
          </div>
        )}
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="u-mono text-foreground file:mr-3 file:border file:border-input file:bg-transparent file:px-3 file:py-2 file:text-foreground"
        />
        <button
          type="submit"
          disabled={pending}
          className="u-mono border border-input px-5 py-2.5 text-foreground transition-colors duration-300 hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {pending ? "Uploading…" : origin.image ? "Replace" : "Upload"}
        </button>
      </div>
      {(state.error || state.message) && (
        <p role={state.error ? "alert" : "status"} className={`u-mono mt-2 ${state.error ? "text-accent" : "text-muted-foreground"}`}>
          {state.error ?? state.message}
        </p>
      )}
    </form>
  );
}

function DeleteForm({ origin, onDone }: { origin: AdminOrigin; onDone: () => void }) {
  const [state, action, pending] = useActionState(deleteOrigin, EMPTY);

  useEffect(() => {
    if (state.message && !state.error) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="mt-8 border-t border-border pt-6">
      <input type="hidden" name="id" value={origin.id} />
      <button
        type="submit"
        disabled={pending}
        className="u-mono border border-destructive px-6 py-3 text-destructive transition-colors duration-300 hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
      >
        {pending ? "Removing…" : "Remove this pin"}
      </button>
      {state.error && <p role="alert" className="u-mono mt-3 text-accent">{state.error}</p>}
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  required,
  textarea,
  span,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  textarea?: boolean;
  span?: boolean;
}) {
  const cls =
    "w-full border border-input bg-muted px-4 py-3 text-foreground outline-none transition-colors duration-300 focus:border-accent";
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <label htmlFor={name} className="u-mono mb-2 block text-muted-foreground">{label}</label>
      {textarea ? (
        <textarea id={name} name={name} rows={3} defaultValue={defaultValue} placeholder={placeholder} className={cls} />
      ) : (
        <input id={name} name={name} defaultValue={defaultValue} placeholder={placeholder} required={required} className={cls} />
      )}
    </div>
  );
}
