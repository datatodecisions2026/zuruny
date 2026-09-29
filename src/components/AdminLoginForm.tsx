"use client";

import { useActionState } from "react";
import { adminSignIn, type AdminAuthState } from "@/lib/admin-auth-actions";
import { AuthField as Field, AuthPasswordField as PasswordField } from "@/components/AuthField";

const EMPTY: AdminAuthState = { error: null, message: null };

/** Sign-in only, on purpose — there is no public admin sign-up. */
export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminSignIn, EMPTY);

  return (
    <form action={action} className="m-cascade max-w-md space-y-9">
      <p className="u-display text-[length:var(--step-2)] text-cream">Sign in to manage the shop.</p>

      <Field name="email" label="Email" type="email" autoComplete="email" required defaultValue={state.email} />
      <PasswordField label="Password" autoComplete="current-password" show="Show" hide="Hide" />

      {state.error && (
        <p className="u-mono border-l-2 border-ochre pl-4 text-ochre" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group u-mono flex w-full items-center justify-between bg-cream px-7 py-5 text-ground transition-colors duration-300 hover:bg-ochre disabled:opacity-50"
      >
        <span>{pending ? "Signing in…" : "Sign in"}</span>
        <span aria-hidden className="transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:translate-x-1.5">
          &rarr;
        </span>
      </button>
    </form>
  );
}
