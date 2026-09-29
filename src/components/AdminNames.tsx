"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import {
  createChapter,
  deleteChapter,
  uploadChapterImage,
  deleteChapterImage,
  type ChapterState,
} from "@/lib/chapter-actions";
import type { AdminChapter, ChapterKind } from "@/lib/chapters";

const EMPTY: ChapterState = { error: null, message: null };

type Candidate = { id: number; handle: string; name: string };

const SLOTS: { kind: ChapterKind; label: string; hint: string; required?: boolean; multiple?: boolean }[] = [
  { kind: "dedication", label: "Dedication", hint: "The illustrated dedication page. Required — a chapter without one is skipped on the site.", required: true },
  { kind: "portrait", label: "Portrait", hint: "A photograph of them, if one exists. Falls back to their pull quote when absent." },
  { kind: "place", label: "Place", hint: "A photo of their village or land." },
  { kind: "product", label: "Product photo", hint: "Overrides the product's own lead photo on the product page of the book, if set." },
  { kind: "detail", label: "Detail images", hint: "Extra photographs. Any number.", multiple: true },
];

export function AdminNames({ chapters, candidates }: { chapters: AdminChapter[]; candidates: Candidate[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="u-mono text-muted-foreground">
          {chapters.length} {chapters.length === 1 ? "name" : "names"} in the book
        </p>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          disabled={candidates.length === 0}
          className="u-mono border border-input px-5 py-3 text-foreground transition-colors duration-300 hover:border-accent hover:text-accent disabled:opacity-40"
        >
          {adding ? "Cancel" : "Add a name"}
        </button>
      </div>

      {candidates.length === 0 && !adding && chapters.length === 0 && (
        <p className="u-mono text-muted-foreground">
          No product has a story yet. Add one on the Products page first — the &ldquo;Their
          story&rdquo; field is what a chapter is built from.
        </p>
      )}

      {adding && <AddForm candidates={candidates} onDone={() => setAdding(false)} />}

      <ul className="divide-y divide-border border-y border-border">
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <div className="flex flex-wrap items-center gap-4 py-4">
              <button
                type="button"
                onClick={() => setOpen(open === chapter.id ? null : chapter.id)}
                aria-expanded={open === chapter.id}
                className="flex-1 text-left"
              >
                <span className="u-display text-[length:var(--step-1)] text-foreground">{chapter.productName}</span>
                <span className="u-mono ml-3 text-muted-foreground">#{chapter.slug}</span>
              </button>
              <span className={`u-mono px-3 py-1 ${chapter.productStatus === "active" ? "text-accent" : "text-muted-foreground"}`}>
                {chapter.productStatus === "active" ? "Published" : chapter.allowDraft ? "Draft, shown in the book" : "Draft, hidden"}
              </span>
              <span className="u-mono w-24 text-right text-foreground">
                {chapter.images.some((i) => i.kind === "dedication") ? "Complete" : "Needs dedication"}
              </span>
            </div>
            {open === chapter.id && <ChapterEditor chapter={chapter} onDone={() => setOpen(null)} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddForm({ candidates, onDone }: { candidates: Candidate[]; onDone: () => void }) {
  const [state, action, pending] = useActionState(createChapter, EMPTY);

  /* useActionState re-renders with the result once the action resolves, so
     react to that — not to the click, whose handler still closes over the
     state from before submission and would close the form on a rejected
     entry too, hiding the error it just set. */
  useEffect(() => {
    if (state.message && !state.error) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="mb-8 grid gap-5 border border-input p-6 sm:grid-cols-2">
      <div>
        <label htmlFor="product_id" className="u-mono mb-2 block text-muted-foreground">Product</label>
        <select
          id="product_id"
          name="product_id"
          required
          className="w-full border border-input bg-muted px-4 py-3 text-foreground outline-none focus:border-accent"
        >
          <option value="">Choose…</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id} className="bg-card">{c.name}</option>
          ))}
        </select>
        <p className="u-mono mt-2 text-muted-foreground">
          Only products with a story (set on the Products page) are listed.
        </p>
      </div>
      <div>
        <label htmlFor="slug" className="u-mono mb-2 block text-muted-foreground">Chapter URL</label>
        <input
          id="slug"
          name="slug"
          placeholder="Leave blank to use the product's URL"
          className="w-full border border-input bg-muted px-4 py-3 text-foreground outline-none focus:border-accent"
        />
      </div>
      <label className="u-mono flex items-center gap-3 text-muted-foreground sm:col-span-2">
        <input type="checkbox" name="allow_draft" className="size-4" />
        Show in the book even while the product is a draft (not for sale, but tells their story)
      </label>
      {(state.error || state.message) && (
        <p role={state.error ? "alert" : "status"} className={`u-mono sm:col-span-2 ${state.error ? "text-accent" : "text-muted-foreground"}`}>
          {state.error ?? state.message}
        </p>
      )}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="u-mono bg-primary px-7 py-4 text-primary-foreground transition-colors duration-300 hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add to the book"}
        </button>
      </div>
    </form>
  );
}

function ChapterEditor({ chapter, onDone }: { chapter: AdminChapter; onDone: () => void }) {
  const [delState, delAction, deleting] = useActionState(deleteChapter, EMPTY);

  useEffect(() => {
    if (delState.message && !delState.error) onDone();
  }, [delState, onDone]);

  return (
    <div className="mb-6 space-y-8 border border-border p-6">
      {SLOTS.map((slot) => (
        <ImageSlot key={slot.kind} chapter={chapter} slot={slot} />
      ))}

      <form action={delAction} className="border-t border-border pt-6">
        <input type="hidden" name="chapter_id" value={chapter.id} />
        <p className="u-mono mb-3 text-muted-foreground">
          Removes {chapter.productName} from the book. The product itself, and its own photos, are
          not touched — only the chapter and its book images.
        </p>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={deleting}
            className="u-mono border border-destructive px-6 py-3 text-destructive transition-colors duration-300 hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
          >
            {deleting ? "Removing…" : "Remove from the book"}
          </button>
          <button type="button" onClick={onDone} className="u-mono px-4 py-3 text-muted-foreground transition-colors hover:text-foreground">
            Close
          </button>
        </div>
        {delState.error && <p role="alert" className="u-mono mt-3 text-accent">{delState.error}</p>}
      </form>
    </div>
  );
}

function ImageSlot({
  chapter,
  slot,
}: {
  chapter: AdminChapter;
  slot: (typeof SLOTS)[number];
}) {
  const images = chapter.images.filter((i) => i.kind === slot.kind);
  const [uploadState, uploadAction, uploading] = useActionState(uploadChapterImage, EMPTY);

  return (
    <div>
      <p className="u-mono text-foreground">
        {slot.label}
        {slot.required && !images.length && <span className="ml-2 text-accent">missing</span>}
      </p>
      <p className="u-mono mt-1 text-muted-foreground">{slot.hint}</p>

      {images.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-4">
          {images.map((image) => (
            <ExistingImage key={image.id} image={image} />
          ))}
        </ul>
      )}

      {(slot.multiple || images.length === 0) && (
        <form action={uploadAction} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="chapter_id" value={chapter.id} />
          <input type="hidden" name="kind" value={slot.kind} />
          <div>
            <label htmlFor={`${chapter.id}-${slot.kind}-file`} className="u-mono mb-1 block text-muted-foreground">
              Image
            </label>
            <input
              id={`${chapter.id}-${slot.kind}-file`}
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className="u-mono text-foreground file:mr-3 file:border file:border-input file:bg-transparent file:px-3 file:py-2 file:text-foreground"
            />
          </div>
          <div>
            <label htmlFor={`${chapter.id}-${slot.kind}-alt`} className="u-mono mb-1 block text-muted-foreground">
              Alt text
            </label>
            <input
              id={`${chapter.id}-${slot.kind}-alt`}
              name="alt"
              placeholder="Describe the image"
              className="border border-input bg-muted px-3 py-2 text-foreground outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="u-mono border border-input px-5 py-2.5 text-foreground transition-colors duration-300 hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
      )}
      {(uploadState.error || uploadState.message) && (
        <p role={uploadState.error ? "alert" : "status"} className={`u-mono mt-2 ${uploadState.error ? "text-accent" : "text-muted-foreground"}`}>
          {uploadState.error ?? uploadState.message}
        </p>
      )}
    </div>
  );
}

function ExistingImage({ image }: { image: AdminChapter["images"][number] }) {
  const [state, action, pending] = useActionState(deleteChapterImage, EMPTY);
  return (
    <li className="w-28">
      <div className="relative aspect-[3/4] overflow-hidden border border-input bg-muted">
        <Image src={image.src} alt={image.alt} fill sizes="112px" className="object-cover" />
      </div>
      <form action={action} className="mt-1">
        <input type="hidden" name="image_id" value={image.id} />
        <button type="submit" disabled={pending} className="u-mono w-full text-muted-foreground transition-colors hover:text-accent disabled:opacity-50">
          {pending ? "Removing…" : "Remove"}
        </button>
      </form>
      {state.error && <p role="alert" className="u-mono text-accent">{state.error}</p>}
    </li>
  );
}
