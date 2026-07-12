import { prisma } from "./db";
import {
  haversineMiles,
  pointToSegmentMiles,
  suggestedFareCents,
} from "./geo";
import { timeToMinutes, jsDayToIndex, dayBit, dateKey, keyToUtcDate } from "./days";
import type { CommuteSchedule } from "@prisma/client";

const WINDOW_TOLERANCE_MIN = 15;
const MAX_DEST_MILES = 3;
const MAX_ORIGIN_DETOUR_MILES = 3;

type ScoredCandidate = {
  riderSchedule: CommuteSchedule;
  driverSchedule: CommuteSchedule;
  score: number;
  sharedDays: number;
  distanceMiles: number;
};

function windowOverlapMinutes(a: CommuteSchedule, b: CommuteSchedule): number {
  const start = Math.max(
    timeToMinutes(a.arriveStart) - WINDOW_TOLERANCE_MIN,
    timeToMinutes(b.arriveStart) - WINDOW_TOLERANCE_MIN
  );
  const end = Math.min(
    timeToMinutes(a.arriveEnd) + WINDOW_TOLERANCE_MIN,
    timeToMinutes(b.arriveEnd) + WINDOW_TOLERANCE_MIN
  );
  return end - start;
}

async function scorePair(
  rider: CommuteSchedule,
  driver: CommuteSchedule
): Promise<ScoredCandidate | null> {
  if (rider.userId === driver.userId) return null;

  const sharedDays = rider.days & driver.days;
  if (sharedDays === 0) return null;

  const overlap = windowOverlapMinutes(rider, driver);
  if (overlap <= 0) return null;

  const destDist = haversineMiles(
    { lat: rider.destLat, lng: rider.destLng },
    { lat: driver.destLat, lng: driver.destLng }
  );
  if (destDist > MAX_DEST_MILES) return null;

  // Zero-detour principle: the rider's pickup must sit on or near the
  // driver's existing route corridor (origin -> destination).
  const corridorDist = pointToSegmentMiles(
    { lat: rider.originLat, lng: rider.originLng },
    { lat: driver.originLat, lng: driver.originLng },
    { lat: driver.destLat, lng: driver.destLng }
  );
  if (corridorDist > MAX_ORIGIN_DETOUR_MILES) return null;

  const originDist = haversineMiles(
    { lat: rider.originLat, lng: rider.originLng },
    { lat: driver.originLat, lng: driver.originLng }
  );

  const [riderUser, driverUser, sharedClusters] = await Promise.all([
    prisma.user.findUnique({
      where: { id: rider.userId },
      select: { verified: true },
    }),
    prisma.user.findUnique({
      where: { id: driver.userId },
      select: { verified: true },
    }),
    prisma.clusterMember.groupBy({
      by: ["clusterId"],
      where: { userId: { in: [rider.userId, driver.userId] } },
      _count: true,
      having: { clusterId: { _count: { equals: 2 } } },
    }),
  ]);
  if (!riderUser || !driverUser) return null;

  const dayCount = [...Array(7)].filter((_, i) => sharedDays & dayBit(i)).length;

  let score = 100;
  score -= corridorDist * 12; // detour is the biggest cost
  score -= destDist * 8;
  score -= Math.min(originDist, 10) * 2;
  score += dayCount * 5;
  score += Math.min(overlap, 60) / 6;
  if (sharedClusters.length > 0) score += 10;
  if (riderUser.verified && driverUser.verified) score += 5;

  const distanceMiles = haversineMiles(
    { lat: rider.originLat, lng: rider.originLng },
    { lat: rider.destLat, lng: rider.destLng }
  );

  return {
    riderSchedule: rider,
    driverSchedule: driver,
    score: Math.round(score * 10) / 10,
    sharedDays,
    distanceMiles: Math.round(distanceMiles * 10) / 10,
  };
}

/**
 * Find compatible opposite-side schedules for the given schedule and persist
 * new Match proposals. Existing matches (any status) are left untouched.
 */
export async function findMatchesForSchedule(scheduleId: string): Promise<number> {
  const schedule = await prisma.commuteSchedule.findUnique({
    where: { id: scheduleId },
  });
  if (!schedule || !schedule.active) return 0;

  const oppositeType = schedule.type === "rider" ? "driver" : "rider";
  const candidates = await prisma.commuteSchedule.findMany({
    where: { type: oppositeType, active: true, userId: { not: schedule.userId } },
  });

  let created = 0;
  for (const candidate of candidates) {
    const rider = schedule.type === "rider" ? schedule : candidate;
    const driver = schedule.type === "rider" ? candidate : schedule;
    const scored = await scorePair(rider, driver);
    if (!scored) continue;

    const existing = await prisma.match.findUnique({
      where: {
        riderScheduleId_driverScheduleId: {
          riderScheduleId: rider.id,
          driverScheduleId: driver.id,
        },
      },
    });
    if (existing) continue;

    await prisma.match.create({
      data: {
        riderScheduleId: rider.id,
        driverScheduleId: driver.id,
        status: "proposed",
        score: scored.score,
        sharedDays: scored.sharedDays,
        distanceMiles: scored.distanceMiles,
        fareCents: suggestedFareCents(scored.distanceMiles),
      },
    });
    created++;
  }
  return created;
}

export async function findMatchesForUser(userId: string): Promise<number> {
  const schedules = await prisma.commuteSchedule.findMany({
    where: { userId, active: true },
  });
  let total = 0;
  for (const s of schedules) total += await findMatchesForSchedule(s.id);
  return total;
}

/**
 * Ensure Ride rows exist for an accepted match for the next `daysAhead` days
 * (on the shared days of the week). Idempotent thanks to the unique constraint.
 */
export async function generateRides(matchId: string, daysAhead = 21): Promise<void> {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.status !== "accepted") return;

  const today = new Date();
  for (let offset = 0; offset < daysAhead; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const idx = jsDayToIndex(d.getDay());
    if (!(match.sharedDays & dayBit(idx))) continue;
    const date = keyToUtcDate(dateKey(d));
    await prisma.ride.upsert({
      where: { matchId_date: { matchId, date } },
      update: {},
      create: { matchId, date },
    });
  }
}

/** Top up upcoming rides for all accepted matches that involve the user. */
export async function ensureUpcomingRides(userId: string): Promise<void> {
  const matches = await prisma.match.findMany({
    where: {
      status: "accepted",
      OR: [
        { riderSchedule: { userId } },
        { driverSchedule: { userId } },
      ],
    },
    select: { id: true },
  });
  for (const m of matches) await generateRides(m.id);
}
