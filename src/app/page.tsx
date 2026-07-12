import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LeafIcon, Logo } from "@/components/Logo";

const steps = [
  {
    title: "Set your schedule once",
    desc: "Where you leave from, where you work, and your arrival window — Mon to Fri, set-it-and-forget-it.",
  },
  {
    title: "Get matched on your corridor",
    desc: "We pair you with a driver already making your exact trip. Zero detours, same person every day.",
  },
  {
    title: "Ride, every single day",
    desc: "No daily coordination, no surge pricing, no luck of the draw. Your commute buddy is expecting you.",
  },
  {
    title: "Pay a flat, fair fare",
    desc: "$3–8 per ride paid directly to your driver — around 80% cheaper than daily Uber.",
  },
];

const audiences = [
  {
    title: "For riders",
    points: [
      "Predictable, affordable daily commutes",
      "One consistent, verified driver — not a stranger every morning",
      "Meet people who live and work along your route",
    ],
  },
  {
    title: "For drivers",
    points: [
      "Earn $60–100/week on the drive you already make",
      "Zero detours — riders come from your existing route",
      "No gig-economy pressure: pre-scheduled, on your terms",
    ],
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboarded ? "/dashboard" : "/onboarding");

  return (
    <main className="min-h-dvh bg-white">
      {/* Header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-emerald-50 via-emerald-50/40 to-white">
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-16 text-center">
          <p className="mx-auto mb-4 w-fit rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700">
            Now piloting in Research Triangle Park & DFW
          </p>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Your daily commute,{" "}
            <span className="text-emerald-600">solved once</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
            EcoLoop matches interns, students, and early-career professionals with
            drivers already making their exact commute. Reliable rides, flat fares,
            real community.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Find my commute buddy
            </Link>
            <Link
              href="/signup"
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-emerald-400"
            >
              I can offer rides
            </Link>
          </div>
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4 text-center">
            {[
              ["80%", "cheaper than daily Uber"],
              ["$60–100", "weekly driver earnings"],
              ["0", "detours for drivers"],
            ].map(([stat, label]) => (
              <div key={label}>
                <p className="text-2xl font-bold text-emerald-700">{stat}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Commuting is broken for people without cars
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["The rideshare rip-off", "$30–50 every day for Uber makes internships unaffordable."],
            ["The transit maze", "90-minute multi-leg trips that still stop a mile from the office."],
            ["The chance carpool", "Finding a coworker who lives nearby shouldn't be pure luck."],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="font-semibold text-gray-900">{title}</p>
              <p className="mt-1 text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-emerald-950 py-16 text-white">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold">How EcoLoop works</h2>
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

      {/* Audiences */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {audiences.map((a) => (
            <div
              key={a.title}
              className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900">{a.title}</h3>
              <ul className="mt-4 space-y-3">
                {a.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    >
                      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Sustainability + CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="rounded-2xl bg-emerald-600 px-6 py-12 text-center text-white">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/15">
            <LeafIcon className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-2xl font-bold">
            Every shared ride keeps a car off the road
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-emerald-50">
            Track the CO2 you save on every commute. Less traffic, lower emissions,
            and a community of people heading the same way.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Join the loop — it&apos;s free
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        EcoLoop — community-powered commuting. Riders pay drivers directly; EcoLoop is a
        connector, not a transportation provider.
      </footer>
    </main>
  );
}
