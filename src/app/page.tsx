import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LeafIcon } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";

const partnerStats = [
  ["SOV trips avoided", "Tracked per program"],
  ["CO₂ & miles shared", "TDM-ready reporting"],
  ["Match rate", "Recurring corridor pairs"],
];

const steps = [
  {
    title: "Partner launches a program",
    desc: "Transit agency or employer enrolls a cohort — summer interns, new hires, or corridor commuters.",
  },
  {
    title: "Commuters set schedule once",
    desc: "Origin, destination, arrival window. Matched on zero-detour corridors with verified work or school email.",
  },
  {
    title: "Recurring carpools run daily",
    desc: "Same driver, same rider, flat fare. No daily coordination, no surge pricing.",
  },
  {
    title: "Impact reported to partners",
    desc: "Live dashboard: rides completed, miles shared, solo-vehicle trips avoided, top corridors.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboarded ? "/dashboard" : "/onboarding");

  return (
    <main className="min-h-dvh bg-white">
      <SiteHeader ctaHref="/join/gotriangle" ctaLabel="Join pilot" />

      <section className="bg-gradient-to-b from-emerald-50 via-emerald-50/40 to-white">
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-16 text-center">
          <p className="mx-auto mb-4 w-fit rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700">
            B2B2C commute programs · Piloting in Research Triangle Park
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Recurring carpools for{" "}
            <span className="text-emerald-600">corridors transit can&apos;t fully serve</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
            EcoLoop partners with transit agencies and employers to match carless
            early-career commuters with drivers already on their daily route —
            with program-level TDM reporting, not just another rideshare app.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-emerald-700">
            Built by a Cisco RTP intern who commutes from Chapel Hill without a car.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/for-transit"
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              For transit partners
            </Link>
            <Link
              href="/join/gotriangle"
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-emerald-400"
            >
              I&apos;m a commuter
            </Link>
          </div>
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4 text-center">
            {partnerStats.map(([stat, label]) => (
              <div key={label}>
                <p className="text-lg font-bold text-emerald-700">{stat}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Built from a real commute
        </h2>
        <p className="mt-4 text-center text-sm text-gray-500">
          Chapel Hill → Cisco RTP · two summers · no car
        </p>
        <div className="mt-8 space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700">
          <p>
            For two summers, the founder chose Chapel Hill for cheaper housing than
            the company stipend — but getting to Cisco RTP without a car meant a
            daily multi-modal chain:
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Chapel Hill Transit (or a 30-minute walk) to reach a stop — often a
              30-minute wait between buses, plus a 5-minute walk from the apartment
            </li>
            <li>
              GoTriangle bus for nearly an hour to the Regional Transit Center
            </li>
            <li>RTP Connect Uber subsidy for the last mile from RTC to campus</li>
          </ol>
          <p>
            A direct drive is about <strong>20 minutes</strong>. This stack is well
            over an hour, every weekday, all summer. This year, housing was chosen
            within walking distance of a GoTriangle stop — shortening leg one, but
            not solving the whole trip.
          </p>
          <p className="font-medium text-emerald-800">
            EcoLoop matches a recurring carpool on that corridor — same driver,
            same rider, flat fare — so GoTriangle and RTP Connect stay where they
            help, and the daily grind gets simpler.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Built for institutional partners, not gig-economy scale
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            [
              "Complements RTP Connect",
              "Subsidized TNC trips help one ride at a time. EcoLoop solves the recurring daily commute for carless interns outside the zone.",
            ],
            [
              "Zero-detour matching",
              "Drivers already making the trip. Riders join their corridor — no fleet, no new routes.",
            ],
            [
              "Verified commuters",
              ".edu and employer email domains, emergency contacts, and recurring schedule commitments.",
            ],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="font-semibold text-gray-900">{title}</p>
              <p className="mt-1 text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-emerald-950 py-16 text-white">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold">How programs work</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.title}>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 font-bold text-emerald-950">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-emerald-100/80">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          <Link
            href="/for-transit"
            className="rounded-2xl border border-sky-200 bg-gradient-to-b from-sky-50 to-white p-6 transition hover:border-sky-300"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              For GoTriangle &amp; TDM partners
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Mode-shift metrics, first/last-mile complement to fixed route, lower
              subsidy burn vs. repeated TNC trips.
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-sky-700">
              View transit pitch →
            </span>
          </Link>
          <Link
            href="/for-employers"
            className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-6 transition hover:border-emerald-200"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              For employers &amp; intern programs
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Reliable commutes for carless interns, ESG commute reporting, branded
              enrollment links.
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-emerald-700">
              View employer info →
            </span>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="rounded-2xl bg-emerald-600 px-6 py-12 text-center text-white">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/15">
            <LeafIcon className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-2xl font-bold">
            See the GoTriangle pilot report
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-emerald-50">
            Live program metrics: enrollment, completed carpools, miles shared, and
            CO₂ avoided — built for TDM partners.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/partner/gotriangle"
              className="inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Partner dashboard
            </Link>
            <Link
              href="/join/gotriangle"
              className="inline-block rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Enroll as commuter
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        EcoLoop — institutional commute programs. Riders pay drivers directly;
        EcoLoop is a connector, not a transportation provider.
      </footer>
    </main>
  );
}
