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
        <p className="u-mono text-[var(--text-faint)]">
          {chapters.length} {chapters.length === 1 ? "name" : "names"} in the book
        </p>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          disabled={candidates.length === 0}
          className="u-mono border border-[var(--rule-strong)] px-5 py-3 text-cream transition-colors duration-300 hover:border-ochre hover:text-ochre disabled:opacity-40"
        >
          {adding ? "Cancel" : "Add a name"}
        </button>
      </div>

      {candidates.length === 0 && !adding && chapters.length === 0 && (
        <p className="u-mono text-[var(--text-faint)]">
          No product has a story yet. Add one on the Products page first — the &ldquo;Their
          story&rdquo; field is what a chapter is built from.
        </p>
      )}

      {adding && <AddForm candidates={candidates} onDone={() => setAdding(false)} />}

      <ul className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <div className="flex flex-wrap items-center gap-4 py-4">
              <button
                type="button"
                onClick={() => setOpen(open === chapter.id ? null : chapter.id)}
                aria-expanded={open === chapter.id}
                className="flex-1 text-left"
              >
                <span className="u-display text-[length:var(--step-1)] text-cream">{chapter.productName}</span>
                <span className="u-mono ml-3 text-[var(--text-faint)]">#{chapter.slug}</span>
              </button>
              <span className={`u-mono px-3 py-1 ${chapter.productStatus === "active" ? "text-ochre" : "text-[var(--text-faint)]"}`}>
                {chapter.productStatus === "active" ? "Published" : chapter.allowDraft ? "Draft, shown in the book" : "Draft, hidden"}
              </span>
              <span className="u-mono w-24 text-right text-cream">
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
    <form action={action} className="mb-8 grid gap-5 border border-[var(--rule-strong)] p-6 sm:grid-cols-2">
      <div>
        <label htmlFor="product_id" className="u-mono mb-2 block text-[var(--text-muted)]">Product</label>
        <select
          id="product_id"
          name="product_id"
          required
          className="w-full border border-[var(--rule-strong)] bg-ground-2 px-4 py-3 text-cream outline-none focus:border-ochre"
        >
          <option value="">Choose…</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id} className="bg-ground">{c.name}</option>
          ))}
        </select>
        <p className="u-mono mt-2 text-[var(--text-faint)]">
          Only products with a story (set on the Products page) are listed.
        </p>
      </div>
      <div>
        <label htmlFor="slug" className="u-mono mb-2 block text-[var(--text-muted)]">Chapter URL</label>
        <input
          id="slug"
          name="slug"
          placeholder="Leave blank to use the product's URL"
          className="w-full border border-[var(--rule-strong)] bg-ground-2 px-4 py-3 text-cream outline-none focus:border-ochre"
        />
      </div>
      <label className="u-mono flex items-center gap-3 text-[var(--text-muted)] sm:col-span-2">
        <input type="checkbox" name="allow_draft" className="size-4" />
        Show in the book even while the product is a draft (not for sale, but tells their story)
      </label>
      {(state.error || state.message) && (
        <p role={state.error ? "alert" : "status"} className={`u-mono sm:col-span-2 ${state.error ? "text-ochre" : "text-[var(--text-muted)]"}`}>
          {state.error ?? state.message}
        </p>
      )}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="u-mono bg-cream px-7 py-4 text-ground transition-colors duration-300 hover:bg-ochre disabled:opacity-50"
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
    <div className="mb-6 space-y-8 border border-[var(--rule)] p-6">
      {SLOTS.map((slot) => (
        <ImageSlot key={slot.kind} chapter={chapter} slot={slot} />
      ))}

      <form action={delAction} className="border-t border-[var(--rule)] pt-6">
        <input type="hidden" name="chapter_id" value={chapter.id} />
        <p className="u-mono mb-3 text-[var(--text-faint)]">
          Removes {chapter.productName} from the book. The product itself, and its own photos, are
          not touched — only the chapter and its book images.
        </p>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={deleting}
            className="u-mono border border-oxblood px-6 py-3 text-ochre transition-colors duration-300 hover:bg-oxblood disabled:opacity-50"
          >
            {deleting ? "Removing…" : "Remove from the book"}
          </button>
          <button type="button" onClick={onDone} className="u-mono px-4 py-3 text-[var(--text-muted)] transition-colors hover:text-cream">
            Close
          </button>
        </div>
        {delState.error && <p role="alert" className="u-mono mt-3 text-ochre">{delState.error}</p>}
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
      <p className="u-mono text-cream">
        {slot.label}
        {slot.required && !images.length && <span className="ml-2 text-ochre">missing</span>}
      </p>
      <p className="u-mono mt-1 text-[var(--text-faint)]">{slot.hint}</p>

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
            <label htmlFor={`${chapter.id}-${slot.kind}-file`} className="u-mono mb-1 block text-[var(--text-faint)]">
              Image
            </label>
            <input
              id={`${chapter.id}-${slot.kind}-file`}
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className="u-mono text-cream file:mr-3 file:border file:border-[var(--rule-strong)] file:bg-transparent file:px-3 file:py-2 file:text-cream"
            />
          </div>
          <div>
            <label htmlFor={`${chapter.id}-${slot.kind}-alt`} className="u-mono mb-1 block text-[var(--text-faint)]">
              Alt text
            </label>
            <input
              id={`${chapter.id}-${slot.kind}-alt`}
              name="alt"
              placeholder="Describe the image"
              className="border border-[var(--rule-strong)] bg-ground-2 px-3 py-2 text-cream outline-none focus:border-ochre"
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="u-mono border border-[var(--rule-strong)] px-5 py-2.5 text-cream transition-colors duration-300 hover:border-ochre hover:text-ochre disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
      )}
      {(uploadState.error || uploadState.message) && (
        <p role={uploadState.error ? "alert" : "status"} className={`u-mono mt-2 ${uploadState.error ? "text-ochre" : "text-[var(--text-muted)]"}`}>
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
      <div className="relative aspect-[3/4] overflow-hidden border border-[var(--rule-strong)] bg-ground-2">
        <Image src={image.src} alt={image.alt} fill sizes="112px" className="object-cover" />
      </div>
      <form action={action} className="mt-1">
        <input type="hidden" name="image_id" value={image.id} />
        <button type="submit" disabled={pending} className="u-mono w-full text-[var(--text-faint)] transition-colors hover:text-ochre disabled:opacity-50">
          {pending ? "Removing…" : "Remove"}
        </button>
      </form>
      {state.error && <p role="alert" className="u-mono text-ochre">{state.error}</p>}
    </li>
  );
}
