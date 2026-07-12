"use client";

import { useActionState } from "react";
import { devLogin, type DevFormState } from "@/lib/dev-actions";

export function DevLoginForm() {
  const [state, formAction, pending] = useActionState<DevFormState, FormData>(
    devLogin,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-300">
          Dev password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? "Checking…" : "Enter dashboard"}
      </button>
    </form>
  );
}
