"use client";

import { Loader2, LogIn } from "lucide-react";
import { useActionState } from "react";

import { loginAction, type ActionState } from "@/app/admin/actions";
import type { AdminStrings } from "@/i18n/admin";

export function LoginForm({ configured, t }: { configured: boolean; t: AdminStrings }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label className="admin-label" htmlFor="email">
          {t.email}
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="admin-input" />
      </div>
      <div>
        <label className="admin-label" htmlFor="password">
          {t.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="admin-input"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-accent">
          {state.error}
        </p>
      ) : null}

      {!configured ? (
        <p className="rounded border border-[var(--color-line)] p-3 text-xs text-dim">
          {t.notConfigured}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-shine inline-flex w-full items-center justify-center gap-2 rounded btn-accent px-5 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.14em] disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <LogIn className="h-4 w-4" aria-hidden />
        )}
        {t.signIn}
      </button>
    </form>
  );
}
