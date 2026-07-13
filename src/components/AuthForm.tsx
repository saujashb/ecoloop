"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, signup, type FormState } from "@/lib/actions";
import { Logo } from "./Logo";

type AuthFormProps = {
  mode: "login" | "signup";
  orgSlug?: string;
  orgName?: string;
  programName?: string;
};

export function AuthForm({ mode, orgSlug, orgName, programName }: AuthFormProps) {
  const action = mode === "login" ? login : signup;
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        {orgName && mode === "signup" && (
          <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-center text-sm text-brand-900">
            <p className="font-semibold">Joining via {orgName}</p>
            {programName && (
              <p className="mt-1 text-brand-700">{programName}</p>
            )}
          </div>
        )}
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {mode === "login"
              ? "Sign in to manage your commute."
              : orgName
                ? "Use your school or work email — your enrollment is linked to this program."
                : "Use your school or work email to get verified instantly."}
          </p>

          <form action={formAction} className="mt-6 space-y-4">
            {orgSlug && mode === "signup" && (
              <input type="hidden" name="orgSlug" value={orgSlug} />
            )}
            {mode === "signup" && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  placeholder="Maya Patel"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@school.edu"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
                placeholder={mode === "signup" ? "8+ characters" : "••••••••"}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {state?.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {pending
                ? "One moment..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          {mode === "login" ? (
            <>
              New to Cadence?{" "}
              <Link
                href={orgSlug ? `/signup?org=${orgSlug}` : "/signup"}
                className="font-medium text-brand-700 hover:underline"
              >
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-brand-700 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
