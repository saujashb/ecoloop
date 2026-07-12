"use client";

import { useActionState } from "react";
import { deleteAccount, type FormState } from "@/lib/actions";

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    deleteAccount,
    undefined
  );

  return (
    <form action={formAction} className="mt-4 space-y-3">
      {state?.error && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      <div>
        <label className="block text-sm font-medium text-red-900">
          Type DELETE to confirm
        </label>
        <input
          name="confirmation"
          required
          autoComplete="off"
          placeholder="DELETE"
          className="mt-1 w-full max-w-xs rounded-lg border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
      </div>
      <button
        disabled={pending}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete my account"}
      </button>
    </form>
  );
}
