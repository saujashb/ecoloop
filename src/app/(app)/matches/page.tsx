import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  acceptMatch,
  declineMatch,
  endMatch,
  refreshMatches,
} from "@/lib/actions";
import { formatDays, formatTime } from "@/lib/days";
import { formatCents } from "@/lib/geo";

export const dynamic = "force-dynamic";

const matchInclude = {
  riderSchedule: { include: { user: true } },
  driverSchedule: { include: { user: true } },
} as const;

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified
    </span>
  );
}

export default async function MatchesPage() {
  const user = await requireUser();

  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { riderSchedule: { userId: user.id } },
        { driverSchedule: { userId: user.id } },
      ],
    },
    include: matchInclude,
    orderBy: [{ status: "asc" }, { score: "desc" }],
  });

  const proposed = matches.filter((m) => m.status === "proposed");
  const accepted = matches.filter((m) => m.status === "accepted");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Matches</h1>
          <p className="mt-1 text-sm text-gray-500">
            Consistent commute partners along your route.
          </p>
        </div>
        <form action={refreshMatches}>
          <button className="rounded-lg border border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
            Find new matches
          </button>
        </form>
      </div>

      {/* Accepted */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Your commute buddies
        </h2>
        {accepted.length === 0 ? (
          <p className="text-sm text-gray-500">
            No accepted matches yet — review your proposals below.
          </p>
        ) : (
          <ul className="space-y-3">
            {accepted.map((m) => {
              const iAmRider = m.riderSchedule.userId === user.id;
              const other = iAmRider ? m.driverSchedule.user : m.riderSchedule.user;
              return (
                <li
                  key={m.id}
                  className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 font-medium text-gray-900">
                        {other.name}
                        {other.verified && <VerifiedBadge />}
                      </p>
                      {other.bio && (
                        <p className="mt-0.5 text-sm text-gray-600">{other.bio}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDays(m.sharedDays)} · arrive{" "}
                        {formatTime(m.riderSchedule.arriveStart)}–
                        {formatTime(m.riderSchedule.arriveEnd)} ·{" "}
                        {formatCents(m.fareCents)}/ride
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
                      Active
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/chat/${m.id}`}
                      className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
                    >
                      Message
                    </Link>
                    <form action={endMatch}>
                      <input type="hidden" name="matchId" value={m.id} />
                      <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100">
                        End match
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Proposed */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Proposed for you
        </h2>
        {proposed.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            No proposals right now. Tap &ldquo;Find new matches&rdquo; after new commuters
            join your corridor.
          </div>
        ) : (
          <ul className="space-y-3">
            {proposed.map((m) => {
              const iAmRider = m.riderSchedule.userId === user.id;
              const other = iAmRider ? m.driverSchedule.user : m.riderSchedule.user;
              const otherSchedule = iAmRider ? m.driverSchedule : m.riderSchedule;
              return (
                <li
                  key={m.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 font-medium text-gray-900">
                        {other.name}
                        {other.verified && <VerifiedBadge />}
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                          {iAmRider ? "Driver" : "Rider"}
                        </span>
                      </p>
                      {other.bio && (
                        <p className="mt-0.5 text-sm text-gray-600">{other.bio}</p>
                      )}
                      <p className="mt-1.5 text-sm text-gray-700">
                        {iAmRider
                          ? `Leaves from ${otherSchedule.originLabel}`
                          : `Pickup near ${otherSchedule.originLabel}`}{" "}
                        · arrives by {formatTime(m.riderSchedule.arriveEnd)}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatDays(m.sharedDays)} · {m.distanceMiles} mi trip ·{" "}
                        {formatCents(m.fareCents)}/ride suggested
                      </p>
                      <div className="mt-1.5 flex gap-3 text-xs text-gray-400">
                        {other.prefQuietRide && <span>Prefers quiet rides</span>}
                        {other.prefMusicOk && <span>Music okay</span>}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {Math.min(99, Math.max(1, Math.round(m.score)))}% fit
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <form action={acceptMatch} className="flex-1">
                      <input type="hidden" name="matchId" value={m.id} />
                      <button className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                        Accept match
                      </button>
                    </form>
                    <form action={declineMatch} className="flex-1">
                      <input type="hidden" name="matchId" value={m.id} />
                      <button className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50">
                        Decline
                      </button>
                    </form>
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
