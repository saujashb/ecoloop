import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";

const benefits = [
  {
    title: "Reliable intern commutes",
    desc: "Carless summer interns get a recurring commute buddy — not a new stranger every morning. Reduces no-shows and housing-stress churn.",
  },
  {
    title: "Flat, predictable cost",
    desc: "$3–8 per ride vs. $30–50/day rideshare. Employers can subsidize or simply promote the program as a benefit.",
  },
  {
    title: "ESG & commute reporting",
    desc: "Track carpools completed, miles shared, and CO₂ avoided per employer program — useful for Scope 3 commute narratives.",
  },
  {
    title: "No fleet, no ops burden",
    desc: "Employees who already drive opt in as drivers. EcoLoop handles matching, scheduling, and verification.",
  },
];

export default async function ForEmployersPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboarded ? "/dashboard" : "/onboarding");

  return (
    <main className="min-h-dvh bg-white">
      <SiteHeader ctaHref="mailto:hello@ecoloop.app" ctaLabel="Partner with us" />

      <section className="bg-gradient-to-b from-emerald-50 to-white px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
            For employers &amp; intern programs
          </p>
          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            Give carless interns a commute that actually works
          </h1>
          <p className="mt-5 text-lg text-gray-600">
            EcoLoop is a B2B2C commute program: your organization enrolls cohorts,
            commuters get matched on recurring corridors, and you get participation
            and impact reporting.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-white p-5"
            >
              <h3 className="font-semibold text-gray-900">{b.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 text-center">
        <h2 className="text-xl font-bold text-gray-900">How enrollment works</h2>
        <ol className="mx-auto mt-6 max-w-md space-y-4 text-left text-sm text-gray-600">
          <li>
            <span className="font-semibold text-emerald-700">1.</span> Employer
            or transit partner launches a program (e.g. Summer 2026 RTP Intern
            Commute).
          </li>
          <li>
            <span className="font-semibold text-emerald-700">2.</span> Commuters
            enroll via a branded link —{" "}
            <Link href="/join/gotriangle" className="text-emerald-700 underline">
              /join/gotriangle
            </Link>
            .
          </li>
          <li>
            <span className="font-semibold text-emerald-700">3.</span> EcoLoop
            matches riders and drivers on shared corridors; partners view live TDM
            metrics at{" "}
            <Link
              href="/partner/gotriangle"
              className="text-emerald-700 underline"
            >
              /partner/gotriangle
            </Link>
            .
          </li>
        </ol>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        <Link href="/" className="hover:text-emerald-700">
          ← EcoLoop home
        </Link>
      </footer>
    </main>
  );
}
