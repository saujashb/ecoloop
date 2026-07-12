import Link from "next/link";
import { requireDevAuth } from "@/lib/dev-auth";
import { getDevStats } from "@/lib/dev-stats";
import { devLogout } from "@/lib/dev-actions";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles =
    role === "driver"
      ? "bg-amber-950 text-amber-300"
      : role === "both"
        ? "bg-violet-950 text-violet-300"
        : "bg-sky-950 text-sky-300";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>
      {role}
    </span>
  );
}

export default async function DevDashboardPage() {
  await requireDevAuth();
  const stats = await getDevStats();
  const o = stats.overview;
  const maxSignup = Math.max(...stats.signupsByDay.map((d) => d.count), 1);

  return (
    <main className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-500">
              EcoLoop Dev
            </p>
            <h1 className="text-lg font-semibold text-white">Pilot metrics</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-slate-400 hover:text-white"
            >
              Live app →
            </Link>
            <form action={devLogout}>
              <button className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {/* Overview */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <StatCard label="Total accounts" value={o.totalUsers} />
            <StatCard
              label="New today"
              value={o.signupsToday}
              sub={`${o.signupsThisWeek} this week`}
            />
            <StatCard
              label="Onboarded"
              value={o.onboardedUsers}
              sub={
                o.totalUsers
                  ? `${Math.round((o.onboardedUsers / o.totalUsers) * 100)}%`
                  : "—"
              }
            />
            <StatCard
              label="Verified"
              value={o.verifiedUsers}
              sub=".edu or company email"
            />
            <StatCard
              label="Active matches"
              value={o.acceptedMatches}
              sub={`${o.totalMatches} total proposals`}
            />
            <StatCard
              label="Rides completed"
              value={o.completedRides}
              sub={`${o.totalRides} scheduled total`}
            />
          </div>
        </section>

        {/* Roles & schedules */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Account roles
            </h2>
            <div className="mt-4 space-y-3">
              {(
                [
                  ["Riders", stats.roles.rider, "sky"],
                  ["Drivers", stats.roles.driver, "amber"],
                  ["Both", stats.roles.both, "violet"],
                ] as const
              ).map(([label, count, color]) => {
                const pct =
                  o.totalUsers > 0
                    ? Math.round((count / o.totalUsers) * 100)
                    : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">{label}</span>
                      <span className="font-medium text-white">
                        {count}{" "}
                        <span className="text-slate-500">({pct}%)</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full bg-${color}-500`}
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            color === "sky"
                              ? "#0ea5e9"
                              : color === "amber"
                                ? "#f59e0b"
                                : "#8b5cf6",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Commute schedules
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <StatCard
                label="Needing rides"
                value={o.riderSchedules}
                sub="rider schedules"
              />
              <StatCard
                label="Offering rides"
                value={o.driverSchedules}
                sub="driver schedules"
              />
            </div>
            <div className="mt-4 flex gap-4 text-sm text-slate-400">
              <span>{o.totalMessages} chat messages</span>
              <span>·</span>
              <span>{o.clusterJoins} cluster joins</span>
            </div>
            {stats.matchStatuses.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {stats.matchStatuses.map((m) => (
                  <span
                    key={m.status}
                    className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                  >
                    {m.status}: {m.count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Signup chart */}
        <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Signups — last 14 days
          </h2>
          <div className="mt-4 flex items-end gap-1.5" style={{ height: 120 }}>
            {stats.signupsByDay.map((d) => (
              <div
                key={d.date}
                className="flex flex-1 flex-col items-center justify-end gap-1"
              >
                <span className="text-[10px] font-medium text-slate-400">
                  {d.count > 0 ? d.count : ""}
                </span>
                <div
                  className="w-full rounded-t bg-emerald-600/80"
                  style={{
                    height: `${Math.max(4, (d.count / maxSignup) * 80)}px`,
                  }}
                  title={`${d.date}: ${d.count}`}
                />
                <span className="text-[9px] text-slate-600">
                  {d.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Top domains */}
        {stats.topDomains.length > 0 && (
          <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Top email domains
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {stats.topDomains.map((d) => (
                <li
                  key={d.domain}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm"
                >
                  <span className="text-white">{d.domain}</span>
                  <span className="ml-2 text-slate-500">{d.count}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Accounts table */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            All accounts ({stats.recentUsers.length} shown)
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-700 bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Signed up</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Schedules</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Matches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                {stats.recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No accounts yet.
                    </td>
                  </tr>
                ) : (
                  stats.recentUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/50">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                        {u.createdAt.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{u.email}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {u.scheduleTypes.length > 0
                          ? u.scheduleTypes.join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.onboarded && (
                            <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] text-emerald-400">
                              onboarded
                            </span>
                          )}
                          {u.verified && (
                            <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                              verified
                            </span>
                          )}
                          {!u.onboarded && (
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">
                              incomplete
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {u.matchCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
