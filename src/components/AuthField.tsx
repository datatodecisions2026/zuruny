"use client";

import { useState } from "react";

/* Shared with AuthForms.tsx (customer sign-in) and AdminLoginForm.tsx (owner
   sign-in), so both forms look identical — one visual language, not two. */

export const authInputClass =
  "w-full border-0 border-b border-[var(--rule-strong)] bg-transparent py-3 text-[length:var(--step-1)] text-cream outline-none focus-visible:outline-none";

/** Label above, a hairline below; the ochre line draws in from the left on focus. */
export function AuthFrame({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="group">
      <label
        htmlFor={id}
        className="u-mono block text-[var(--text-faint)] transition-colors duration-300 group-focus-within:text-ochre"
      >
        {label}
      </label>
      <div className="relative">
        {children}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-ochre transition-transform duration-500 ease-[var(--ease-out-soft)] group-focus-within:scale-x-100"
        />
      </div>
    </div>
  );
}

export function AuthField({
  name,
  label,
  type,
  autoComplete,
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <AuthFrame id={name} label={label}>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        defaultValue={defaultValue}
        className={authInputClass}
      />
    </AuthFrame>
  );
}

export function AuthPasswordField({ label, autoComplete, show, hide }: { label: string; autoComplete: string; show: string; hide: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <AuthFrame id="password" label={label}>
      <input
        id="password"
        name="password"
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        className={`${authInputClass} pr-20`}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-pressed={visible}
        className="u-mono absolute bottom-0 right-0 min-h-11 px-1 text-[var(--text-faint)] transition-colors hover:text-cream"
      >
        {visible ? hide : show}
      </button>
    </AuthFrame>
  );
}
