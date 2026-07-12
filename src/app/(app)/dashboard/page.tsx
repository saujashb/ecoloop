import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUpcomingRides } from "@/lib/matching";
import { cancelRide, completeRide } from "@/lib/actions";
import { dateKey, keyToUtcDate, formatTime, formatDays } from "@/lib/days";
import { formatCents } from "@/lib/geo";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  await ensureUpcomingRides(user.id);

  const todayKey = dateKey(new Date());
  const weekAhead = new Date();
  weekAhead.setDate(weekAhead.getDate() + 7);

  const rides = await prisma.ride.findMany({
    where: {
      date: { gte: keyToUtcDate(todayKey), lt: keyToUtcDate(dateKey(weekAhead)) },
      match: {
        status: "accepted",
        OR: [
          { riderSchedule: { userId: user.id } },
          { driverSchedule: { userId: user.id } },
        ],
      },
    },
    include: {
      match: {
        include: {
          riderSchedule: { include: { user: true } },
          driverSchedule: { include: { user: true } },
        },
      },
    },
    orderBy: { date: "asc" },
  });

  // Ride dates are stored as UTC midnight, so compare on the ISO date part.
  const todayRides = rides.filter((r) => r.date.toISOString().startsWith(todayKey));
  const upcoming = rides.filter((r) => !r.date.toISOString().startsWith(todayKey));

  const proposedCount = await prisma.match.count({
    where: {
      status: "proposed",
      OR: [
        { riderSchedule: { userId: user.id } },
        { driverSchedule: { userId: user.id } },
      ],
    },
  });

  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Good morning, {firstName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {todayRides.length > 0
            ? "Here's your commute for today."
            : "No ride scheduled today."}
        </p>
      </div>

      {proposedCount > 0 && (
        <Link
          href="/matches"
          className="block rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
        >
          You have {proposedCount} proposed match{proposedCount > 1 ? "es" : ""} waiting —
          review them →
        </Link>
      )}

      {/* Today */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Today
        </h2>
        {todayRides.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            Nothing scheduled today.{" "}
            <Link href="/matches" className="font-medium text-emerald-700 hover:underline">
              Find a match
            </Link>{" "}
            to set up your recurring commute.
          </div>
        ) : (
          <ul className="space-y-3">
            {todayRides.map((ride) => {
              const m = ride.match;
              const iAmRider = m.riderSchedule.userId === user.id;
              const other = iAmRider ? m.driverSchedule.user : m.riderSchedule.user;
              const schedule = iAmRider ? m.driverSchedule : m.riderSchedule;
              const venmo = m.driverSchedule.user.venmoHandle;
              return (
                <li
                  key={ride.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {iAmRider ? `Ride with ${other.name}` : `Driving ${other.name}`}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        Arrive {formatTime(schedule.arriveStart)}–{formatTime(schedule.arriveEnd)} ·{" "}
                        {m.distanceMiles} mi · {formatCents(m.fareCents)}/ride
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {m.riderSchedule.originLabel} → {m.riderSchedule.destLabel}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        ride.status === "scheduled"
                          ? "bg-emerald-100 text-emerald-800"
                          : ride.status === "completed"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-red-50 text-red-600"
                      }`}
                    >
                      {ride.status}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/chat/${m.id}`}
                      className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
                    >
                      Message
                    </Link>
                    {iAmRider && venmo && (
                      <a
                        href={`https://account.venmo.com/pay?recipients=${venmo}&amount=${(m.fareCents / 100).toFixed(2)}&note=EcoLoop%20ride`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                      >
                        Pay {formatCents(m.fareCents)} on Venmo
                      </a>
                    )}
                    {ride.status === "scheduled" && (
                      <>
                        <form action={completeRide}>
                          <input type="hidden" name="rideId" value={ride.id} />
                          <button className="rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                            Mark completed
                          </button>
                        </form>
                        <form action={cancelRide}>
                          <input type="hidden" name="rideId" value={ride.id} />
                          <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                            Cancel today
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Upcoming */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Next 7 days
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming rides yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {upcoming.map((ride) => {
              const m = ride.match;
              const iAmRider = m.riderSchedule.userId === user.id;
              const other = iAmRider ? m.driverSchedule.user : m.riderSchedule.user;
              const d = new Date(ride.date);
              const label = d.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              });
              return (
                <li key={ride.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">
                      {iAmRider ? `with ${other.name}` : `driving ${other.name}`} · arrive by{" "}
                      {formatTime(m.riderSchedule.arriveEnd)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      ride.status === "cancelled" ? "text-red-500" : "text-gray-400"
                    }`}
                  >
                    {ride.status === "cancelled" ? "cancelled" : formatCents(m.fareCents)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* My schedules */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          My commute
        </h2>
        <ul className="space-y-2">
          {user.schedules.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
            >
              <span
                className={`mr-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                  s.type === "driver"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {s.type === "driver" ? "Offering rides" : "Needing rides"}
              </span>
              <span className="text-gray-700">
                {s.originLabel} → {s.destLabel}
              </span>
              <p className="mt-1 text-xs text-gray-500">
                {formatDays(s.days)} · arrive {formatTime(s.arriveStart)}–{formatTime(s.arriveEnd)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
