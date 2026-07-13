import Link from "next/link";
import { notFound } from "next/navigation";
import { getPartnerStats } from "@/lib/partner-stats";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  sub,
  metric = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  metric?: boolean;
}) {
  return (
    <div
      className={
        metric
          ? "rounded-xl border border-tdm-200 bg-gradient-to-b from-tdm-50 to-white p-4 shadow-sm"
          : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      }
    >
      <p
        className={
          metric
            ? "text-xs font-semibold uppercase tracking-wide text-tdm-700"
            : "text-xs font-semibold uppercase tracking-wide text-slate-500"
        }
      >
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export default async function PartnerReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const stats = await getPartnerStats(slug);
  if (!stats) notFound();

  const o = stats.overview;
  const maxWeek = Math.max(...stats.weeklyCompletedRides.map((w) => w.count), 1);
  const isTransit = stats.organization.type === "transit_agency";

  return (
    <main className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Cadence partner report
            </p>
            <h1 className="text-xl font-bold text-slate-900">
              {stats.organization.name}
            </h1>
            {stats.program && (
              <p className="text-sm text-slate-600">
                {stats.program.name}
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {stats.program.status}
                </span>
              </p>
            )}
          </div>
          <Link
            href={isTransit ? "/for-transit" : "/for-employers"}
            className="text-sm text-slate-500 hover:text-transit-700"
          >
            ← Partner info
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <section className="rounded-2xl border border-tdm-200 bg-tdm-50 px-6 py-5">
          <h2 className="font-semibold text-tdm-900">TDM impact summary</h2>
          <p className="mt-2 text-sm text-tdm-800">
            {isTransit
              ? "Recurring carpools complement fixed-route transit by filling first/last-mile gaps for carless early-career commuters — with measurable mode shift away from single-occupancy vehicles and subsidized TNC trips."
              : "Program participation, match rates, and commute reliability for carless employees and interns."}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Program participation
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Enrolled" value={o.enrolledCommuters} />
            <StatCard label="Onboarded" value={o.onboardedCommuters} />
            <StatCard label="Active schedules" value={o.activeSchedules} />
            <StatCard
              label="Accepted matches"
              value={o.acceptedMatches}
              sub="recurring pairs"
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Mobility &amp; environmental outcomes
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Completed rides" value={o.completedRides} metric />
            <StatCard
              label="Miles shared"
              value={o.milesShared}
              sub="passenger-miles in carpools"
              metric
            />
            <StatCard
              label="CO₂ avoided"
              value={`${o.co2AvoidedKg} kg`}
              sub="EPA passenger-car equivalent"
              metric
            />
            <StatCard
              label="SOV trips avoided"
              value={o.soloTripsAvoided}
              sub="vs. driving alone or TNC"
              metric
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Weekly completed rides
            </h2>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex h-32 items-end gap-1">
                {stats.weeklyCompletedRides.map((w) => (
                  <div
                    key={w.week}
                    className="flex flex-1 flex-col items-center gap-1"
                    title={`${w.week}: ${w.count}`}
                  >
                    <div
                      className="w-full rounded-t bg-tdm-600"
                      style={{
                        height: `${Math.max(4, (w.count / maxWeek) * 100)}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Role mix
            </h2>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <ul className="space-y-2 text-sm">
                {(["rider", "driver", "both"] as const).map((role) => (
                  <li key={role} className="flex justify-between">
                    <span className="capitalize text-slate-600">{role}</span>
                    <span className="font-semibold text-slate-900">
                      {stats.roles[role]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {(stats.topDestinations.length > 0 || stats.topOrigins.length > 0) && (
          <section className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Top destinations
              </h2>
              <ul className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                {stats.topDestinations.map((d) => (
                  <li
                    key={d.label}
                    className="flex justify-between px-4 py-3 text-sm"
                  >
                    <span className="truncate text-slate-700">{d.label}</span>
                    <span className="ml-2 font-medium text-slate-900">
                      {d.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Top origins
              </h2>
              <ul className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                {stats.topOrigins.map((d) => (
                  <li
                    key={d.label}
                    className="flex justify-between px-4 py-3 text-sm"
                  >
                    <span className="truncate text-slate-700">{d.label}</span>
                    <span className="ml-2 font-medium text-slate-900">
                      {d.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <p className="text-center text-xs text-slate-400">
          Updated on each page load from live program data. Cadence is a commute
          connector — riders pay drivers directly.
        </p>
      </div>
    </main>
  );
}
