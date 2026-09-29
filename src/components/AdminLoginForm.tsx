"use client";

import { useActionState, useState } from "react";
import { adminSignIn, type AdminAuthState } from "@/lib/admin-auth-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const EMPTY: AdminAuthState = { error: null, message: null };

/** Sign-in only, on purpose — there is no public admin sign-up. */
export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminSignIn, EMPTY);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="w-full max-w-sm space-y-5 rounded-lg border border-border bg-card p-8">
      <div>
        <p className="admin-display text-2xl text-foreground">Sign in</p>
        <p className="mt-1 text-sm text-muted-foreground">Manage the shop.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="admin-mono text-xs text-muted-foreground">
          Email
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.email} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="admin-mono text-xs text-muted-foreground">
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="pr-16"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="admin-mono absolute inset-y-0 right-0 px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
