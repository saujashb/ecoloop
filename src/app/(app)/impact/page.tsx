import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { co2SavedKg, formatCents, uberEstimateCents } from "@/lib/geo";
import { formatTime } from "@/lib/days";
import { publicUserSelect } from "@/lib/user-select";

export const dynamic = "force-dynamic";

export default async function ImpactPage() {
  const user = await requireUser();

  const rides = await prisma.ride.findMany({
    where: {
      date: { lte: new Date() },
      match: {
        OR: [
          { riderSchedule: { userId: user.id } },
          { driverSchedule: { userId: user.id } },
        ],
      },
    },
    include: {
      match: {
        include: {
          riderSchedule: { include: { user: { select: publicUserSelect } } },
          driverSchedule: { include: { user: { select: publicUserSelect } } },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const completed = rides.filter((r) => r.status === "completed");
  const totalMiles = completed.reduce((sum, r) => sum + r.match.distanceMiles, 0);
  const totalCo2 = completed.reduce(
    (sum, r) => sum + co2SavedKg(r.match.distanceMiles),
    0
  );
  const totalSavedCents = completed.reduce((sum, r) => {
    const iAmRider = r.match.riderSchedule.userId === user.id;
    if (!iAmRider) return sum + r.match.fareCents; // drivers earn the fare
    return sum + (uberEstimateCents(r.match.distanceMiles) - r.match.fareCents);
  }, 0);
  const isMostlyDriver = user.role === "driver";

  const stats = [
    {
      label: "Rides completed",
      value: String(completed.length),
      sub: `${totalMiles.toFixed(0)} shared miles`,
    },
    {
      label: isMostlyDriver ? "Earned on your commute" : "Saved vs. Uber",
      value: formatCents(totalSavedCents),
      sub: isMostlyDriver ? "paid directly by riders" : "estimated",
    },
    {
      label: "CO2 avoided",
      value: `${totalCo2.toFixed(1)} kg`,
      sub: `≈ ${(totalCo2 / 21).toFixed(1)} trees' monthly uptake`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Your impact</h1>
        <p className="mt-1 text-sm text-gray-500">
          Every shared ride keeps a car off the road.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-brand-100 bg-gradient-to-b from-brand-50 to-white p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.sub}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Ride history
        </h2>
        {rides.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            Your completed rides will show up here.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {rides.map((ride) => {
              const m = ride.match;
              const iAmRider = m.riderSchedule.userId === user.id;
              const other = iAmRider ? m.driverSchedule.user : m.riderSchedule.user;
              const label = new Date(ride.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              });
              return (
                <li key={ride.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {label} · {iAmRider ? `with ${other.name}` : `drove ${other.name}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      arrive by {formatTime(m.riderSchedule.arriveEnd)} · {m.distanceMiles} mi
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${
                        ride.status === "completed"
                          ? "text-brand-700"
                          : ride.status === "cancelled"
                            ? "text-red-500"
                            : "text-gray-400"
                      }`}
                    >
                      {ride.status === "completed"
                        ? formatCents(m.fareCents)
                        : ride.status}
                    </p>
                    {ride.status === "completed" && (
                      <p className="text-xs text-gray-400">
                        {co2SavedKg(m.distanceMiles).toFixed(1)} kg CO2 saved
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
