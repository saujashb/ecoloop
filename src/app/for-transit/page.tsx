import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";

const benefits = [
  {
    title: "Complement RTP Connect",
    desc: "RTP Connect subsidizes one-off Lyft/Uber trips. EcoLoop covers recurring daily commutes where fixed-route transit plus TNC subsidy still leaves gaps — especially for carless interns outside the service zone.",
  },
  {
    title: "Measurable TDM outcomes",
    desc: "Partner dashboard tracks enrolled commuters, completed carpools, miles shared, solo-vehicle trips avoided, and CO₂ reduced — exportable metrics for grant reporting and mode-shift goals.",
  },
  {
    title: "First / last mile without new fleet",
    desc: "Uses existing commuter trips already on the road. Zero-detour matching means drivers aren't asked to detour — riders join corridors that already exist.",
  },
  {
    title: "Lower subsidy burn",
    desc: "A matched recurring carpool at $4–8/ride can cost less per trip than repeated $10 TNC subsidies for the same commuter, 10 weeks in a row.",
  },
];

const pilotAsk = [
  "90-day pilot in Research Triangle Park focused on carless summer interns",
  "Co-branded enrollment at join/gotriangle with GoTriangle program tracking",
  "Shared success metrics: match rate, ride completion, SOV reduction vs. baseline",
  "Optional: referral from GoRTP to employers with intern cohorts (Cisco, IBM, TI)",
];

export default async function ForTransitPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboarded ? "/dashboard" : "/onboarding");

  return (
    <main className="min-h-dvh bg-white">
      <SiteHeader ctaHref="/join/gotriangle" ctaLabel="View pilot" />

      <section className="bg-gradient-to-b from-sky-50 to-white px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-700">
            For transit agencies &amp; TDM partners
          </p>
          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            Recurring carpools for corridors transit can&apos;t fully serve
          </h1>
          <p className="mt-5 text-lg text-gray-600">
            EcoLoop helps GoTriangle and regional TDM partners fill first/last-mile
            gaps for carless early-career commuters — with program-level reporting,
            not just another consumer app.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/partner/gotriangle"
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Live pilot report
            </Link>
            <Link
              href="/join/gotriangle"
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:border-emerald-400"
            >
              Commuter enrollment
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Why partner with EcoLoop
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-gray-200 p-5"
            >
              <h3 className="font-semibold text-gray-900">{b.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-emerald-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold">Proposed GoTriangle pilot</h2>
          <ul className="mt-6 space-y-3">
            {pilotAsk.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-emerald-100">
                <span className="mt-0.5 text-emerald-400">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-emerald-200/80">
            Contact:{" "}
            <a
              href="mailto:commute@rtp.org"
              className="underline hover:text-white"
            >
              commute@rtp.org
            </a>{" "}
            (GoRTP) is the existing RTP TDM channel — EcoLoop proposes a
            complementary recurring-carpool layer, not a replacement for RTP
            Connect or fixed-route service.
          </p>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-gray-400">
        <Link href="/" className="hover:text-emerald-700">
          ← EcoLoop home
        </Link>
      </footer>
    </main>
  );
}
