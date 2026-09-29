"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/lib/auth-actions";
import { usePreferences } from "@/lib/preferences";

const EMPTY: AuthState = { error: null, message: null };

export function AuthForms() {
  const { t } = usePreferences();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [signInState, signInAction, signingIn] = useActionState(signIn, EMPTY);
  const [signUpState, signUpAction, signingUp] = useActionState(signUp, EMPTY);

  const state = mode === "in" ? signInState : signUpState;
  const pending = mode === "in" ? signingIn : signingUp;
  const label = mode === "in" ? t.nav.signIn : t.account.createAccount;

  return (
    <div>
      {/* Segmented switch; the ochre plate slides under the active half. */}
      <div className="relative mb-12 grid grid-cols-2 border border-[var(--rule-strong)] p-1">
        <span
          aria-hidden
          className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] bg-cream transition-transform duration-500 ease-[var(--ease-out-soft)] ${
            mode === "up" ? "translate-x-full" : "translate-x-0"
          }`}
        />
        {(
          [
            ["in", t.nav.signIn],
            ["up", t.account.createAccount],
          ] as const
        ).map(([value, text]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className={`u-mono relative min-h-11 px-3 py-3 transition-colors duration-500 ${
              mode === value ? "text-ground" : "text-[var(--text-muted)] hover:text-cream"
            }`}
          >
            {text}
          </button>
        ))}
      </div>

      <form
        key={mode}
        action={mode === "in" ? signInAction : signUpAction}
        className="m-cascade space-y-9"
      >
        <p className="u-display text-[length:var(--step-2)] text-cream">
          {mode === "in" ? t.account.signInLead : t.account.signUpLead}
        </p>

        {mode === "up" && (
          <Field name="full_name" label={t.account.name} type="text" autoComplete="name" />
        )}
        <Field name="email" label={t.account.email} type="email" autoComplete="email" required />
        <PasswordField
          label={t.account.password}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          show={t.account.showPassword}
          hide={t.account.hidePassword}
        />

        {state.error && (
          <p className="u-mono border-l-2 border-ochre pl-4 text-ochre" role="alert">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="u-mono border-l-2 border-[var(--rule-strong)] pl-4 text-[var(--text-muted)]" role="status">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="group u-mono flex w-full items-center justify-between bg-cream px-7 py-5 text-ground transition-colors duration-300 hover:bg-ochre disabled:opacity-50"
        >
          <span>{pending ? t.account.working : label}</span>
          <span aria-hidden className="transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:translate-x-1.5">
            &rarr;
          </span>
        </button>

        <p className="text-[length:var(--step--1)] text-[var(--text-muted)]">
          {mode === "in" ? t.account.newHere : t.account.haveAccount}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
            className="u-underline text-cream transition-colors hover:text-ochre"
          >
            {mode === "in" ? t.account.createAccount : t.nav.signIn}
          </button>
        </p>
      </form>
    </div>
  );
}

const inputClass =
  "w-full border-0 border-b border-[var(--rule-strong)] bg-transparent py-3 text-[length:var(--step-1)] text-cream outline-none focus-visible:outline-none";

/** Label above, a hairline below; the ochre line draws in from the left on focus. */
function Frame({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
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

function Field({
  name,
  label,
  type,
  autoComplete,
  required,
}: {
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <Frame id={name} label={label}>
      <input id={name} name={name} type={type} autoComplete={autoComplete} required={required} className={inputClass} />
    </Frame>
  );
}

function PasswordField({ label, autoComplete, show, hide }: { label: string; autoComplete: string; show: string; hide: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <Frame id="password" label={label}>
      <input
        id="password"
        name="password"
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        className={`${inputClass} pr-20`}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-pressed={visible}
        className="u-mono absolute bottom-0 right-0 min-h-11 px-1 text-[var(--text-faint)] transition-colors hover:text-cream"
      >
        {visible ? hide : show}
      </button>
    </Frame>
  );
}
