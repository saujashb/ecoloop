import Link from "next/link";
import { redirect } from "next/navigation";
import {
  isDevAuthenticated,
  isDevDashboardEnabled,
} from "@/lib/dev-auth";
import { DevLoginForm } from "@/components/DevLoginForm";

export default async function DevLoginPage() {
  if (!isDevDashboardEnabled()) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-4">
        <div className="max-w-sm text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Dev dashboard
          </p>
          <h1 className="mt-2 text-xl font-semibold text-white">Disabled</h1>
          <p className="mt-2 text-sm text-slate-400">
            Set <code className="text-emerald-400">DEV_ADMIN_SECRET</code> in your
            environment to enable this page.
          </p>
        </div>
      </main>
    );
  }

  if (await isDevAuthenticated()) redirect("/dev");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center font-mono text-xs uppercase tracking-widest text-slate-500">
          EcoLoop · Dev
        </p>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h1 className="text-lg font-semibold text-white">Developer access</h1>
          <p className="mt-1 text-sm text-slate-400">
            Internal stats only. Not visible to app users.
          </p>
          <div className="mt-6">
            <DevLoginForm />
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-slate-600">
          <Link href="/" className="hover:text-slate-400">
            ← Back to app
          </Link>
        </p>
      </div>
    </main>
  );
}
