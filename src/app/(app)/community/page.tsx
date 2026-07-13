import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { joinCluster, leaveCluster } from "@/lib/actions";
import { haversineMiles } from "@/lib/geo";
import { formatDays, formatTime } from "@/lib/days";
import { publicUserSelect } from "@/lib/user-select";

export const dynamic = "force-dynamic";

const NEARBY_MILES = 15;

export default async function CommunityPage() {
  const user = await requireUser();
  const mySchedule = user.schedules[0] ?? null;

  const others = await prisma.user.findMany({
    where: { id: { not: user.id }, onboarded: true },
    select: {
      ...publicUserSelect,
      schedules: { where: { active: true } },
    },
  });

  const nearby = others
    .map((u) => {
      const s = u.schedules[0];
      if (!s || !mySchedule) return null;
      const homeDist = haversineMiles(
        { lat: mySchedule.originLat, lng: mySchedule.originLng },
        { lat: s.originLat, lng: s.originLng }
      );
      const workDist = haversineMiles(
        { lat: mySchedule.destLat, lng: mySchedule.destLng },
        { lat: s.destLat, lng: s.destLng }
      );
      return { user: u, schedule: s, homeDist, workDist };
    })
    .filter(
      (x): x is NonNullable<typeof x> =>
        x !== null && (x.homeDist <= NEARBY_MILES || x.workDist <= 3)
    )
    .sort((a, b) => a.homeDist - b.homeDist);

  const clusters = await prisma.cluster.findMany({
    include: { members: { include: { user: true } } },
    orderBy: { name: "asc" },
  });
  const myClusterIds = new Set(user.clusters.map((c) => c.clusterId));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Community</h1>
        <p className="mt-1 text-sm text-gray-500">
          People commuting from your area — your future carpool network.
        </p>
      </div>

      {/* Clusters */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Commute clusters
        </h2>
        <ul className="space-y-3">
          {clusters.map((cluster) => {
            const isMember = myClusterIds.has(cluster.id);
            return (
              <li
                key={cluster.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{cluster.name}</p>
                  <p className="text-xs text-gray-500">
                    {cluster.region} · {cluster.members.length} member
                    {cluster.members.length === 1 ? "" : "s"}
                  </p>
                  {cluster.description && (
                    <p className="mt-1 text-sm text-gray-600">{cluster.description}</p>
                  )}
                </div>
                <form action={isMember ? leaveCluster : joinCluster}>
                  <input type="hidden" name="clusterId" value={cluster.id} />
                  <button
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      isMember
                        ? "border border-gray-300 text-gray-600 hover:bg-gray-50"
                        : "bg-brand-600 text-white hover:bg-brand-700"
                    }`}
                  >
                    {isMember ? "Leave" : "Join"}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Nearby commuters */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Commuting near you
        </h2>
        {nearby.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            No nearby commuters yet. Invite coworkers and neighbors — every new member
            makes matching stronger.
          </div>
        ) : (
          <ul className="space-y-3">
            {nearby.map(({ user: u, schedule: s, homeDist }) => (
              <li
                key={u.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-800">
                      {u.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div>
                      <p className="flex flex-wrap items-center gap-2 font-medium text-gray-900">
                        {u.name}
                        {u.verified && (
                          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-800">
                            Verified
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            s.type === "driver"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {s.type === "driver" ? "Offers rides" : "Needs rides"}
                        </span>
                      </p>
                      {u.bio && <p className="mt-0.5 text-sm text-gray-600">{u.bio}</p>}
                      <p className="mt-1 text-xs text-gray-500">
                        From {s.originLabel} · {formatDays(s.days)} · arrives by{" "}
                        {formatTime(s.arriveEnd)}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-gray-400">
                    {homeDist.toFixed(1)} mi away
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
