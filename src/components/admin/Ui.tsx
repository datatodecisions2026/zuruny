"use client";

import { useActionState } from "react";

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="u-spec text-char-soft">{label}</span>
      <input
        name={name}
        type={type}
        step={type === "number" ? "0.01" : undefined}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="mt-1 w-full border border-bronze/30 bg-card px-3 py-2.5 text-char outline-none focus:border-bronze"
      />
      {hint ? (
        <span className="u-spec mt-1 block text-char-soft">{hint}</span>
      ) : null}
    </label>
  );
}

export function Area({
  label,
  name,
  defaultValue,
  rows = 5,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="u-spec text-char-soft">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full border border-bronze/30 bg-card px-3 py-2.5 leading-relaxed text-char outline-none focus:border-bronze"
      />
      {hint ? (
        <span className="u-spec mt-1 block text-char-soft">{hint}</span>
      ) : null}
    </label>
  );
}

export function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="u-spec text-char-soft">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full border border-bronze/30 bg-card px-3 py-2.5 text-char outline-none focus:border-bronze"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Submit({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="bg-oxblood px-6 py-3 text-sm tracking-[0.14em] text-paper transition-colors hover:bg-oxblood-deep"
    >
      {children}
    </button>
  );
}

/** Wraps a server action so the message it returns can be shown inline. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (
    prev: string | null,
    fd: FormData,
  ) => Promise<string | null | undefined>;
  children: React.ReactNode;
  className?: string;
}) {
  const [message, formAction, pending] = useActionState(
    async (prev: string | null, fd: FormData) => (await action(prev, fd)) ?? null,
    null,
  );
  const good = message === "Saved." || message === "Added.";
  return (
    <form action={formAction} className={className}>
      {children}
      {message ? (
        <p
          className={`u-spec mt-3 ${good ? "text-char-soft" : "text-oxblood"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
      {pending ? (
        <p className="u-spec mt-3 text-char-soft">Working…</p>
      ) : null}
    </form>
  );
}
