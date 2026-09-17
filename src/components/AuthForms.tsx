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

  return (
    <div className="u-measure">
      <div className="mb-10 flex gap-6 border-b border-[var(--rule)]">
        {(
          [
            ["in", t.nav.signIn],
            ["up", t.account.createAccount],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className={`u-mono -mb-px border-b pb-3 transition-colors duration-300 ${
              mode === value
                ? "border-ochre text-ochre"
                : "border-transparent text-[var(--text-muted)] hover:text-cream"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        key={mode}
        action={mode === "in" ? signInAction : signUpAction}
        className="space-y-6"
      >
        {mode === "up" && (
          <Field
            name="full_name"
            label={t.account.name}
            type="text"
            autoComplete="name"
          />
        )}
        <Field
          name="email"
          label={t.account.email}
          type="email"
          autoComplete="email"
          required
        />
        <Field
          name="password"
          label={t.account.password}
          type="password"
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          required
        />

        {state.error && (
          <p className="u-mono text-ochre" role="alert">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="u-mono text-[var(--text-muted)]" role="status">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="u-mono w-full bg-cream px-7 py-4 text-ground transition-colors duration-300 hover:bg-ochre disabled:opacity-50"
        >
          {pending
            ? t.account.working
            : mode === "in"
              ? t.nav.signIn
              : t.account.createAccount}
        </button>
      </form>
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
    <div>
      <label htmlFor={name} className="u-mono mb-2 block text-[var(--text-muted)]">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="w-full border border-[var(--rule-strong)] bg-ground-2 px-4 py-3 text-cream outline-none transition-colors duration-300 focus:border-ochre"
      />
    </div>
  );
}
