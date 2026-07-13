import { prisma } from "./db";
import { co2SavedKg } from "./geo";
import { getOrganizationBySlug } from "./organizations";

export type PartnerStats = {
  organization: {
    slug: string;
    name: string;
    type: string;
    description: string | null;
    region: string | null;
  };
  program: {
    name: string;
    slug: string;
    status: string;
  } | null;
  overview: {
    enrolledCommuters: number;
    onboardedCommuters: number;
    activeSchedules: number;
    acceptedMatches: number;
    completedRides: number;
    milesShared: number;
    co2AvoidedKg: number;
    soloTripsAvoided: number;
    estimatedParkingSpacesFreed: number;
  };
  roles: { rider: number; driver: number; both: number };
  topDestinations: { label: string; count: number }[];
  topOrigins: { label: string; count: number }[];
  weeklyCompletedRides: { week: string; count: number }[];
};

function startOfWeek(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function getPartnerStats(
  orgSlug: string
): Promise<PartnerStats | null> {
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) return null;

  const program = await prisma.program.findFirst({
    where: {
      organizationId: org.id,
      status: { in: ["active", "pilot"] },
    },
    orderBy: { createdAt: "desc" },
  });

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: org.id },
    select: { userId: true },
  });
  const userIds = members.map((m) => m.userId);

  if (userIds.length === 0) {
    return {
      organization: {
        slug: org.slug,
        name: org.name,
        type: org.type,
        description: org.description,
        region: org.region,
      },
      program: program
        ? { name: program.name, slug: program.slug, status: program.status }
        : null,
      overview: {
        enrolledCommuters: 0,
        onboardedCommuters: 0,
        activeSchedules: 0,
        acceptedMatches: 0,
        completedRides: 0,
        milesShared: 0,
        co2AvoidedKg: 0,
        soloTripsAvoided: 0,
        estimatedParkingSpacesFreed: 0,
      },
      roles: { rider: 0, driver: 0, both: 0 },
      topDestinations: [],
      topOrigins: [],
      weeklyCompletedRides: [],
    };
  }

  const [
    enrolledCommuters,
    onboardedCommuters,
    roleGroups,
    schedules,
    acceptedMatches,
    completedRides,
  ] = await Promise.all([
    prisma.organizationMember.count({ where: { organizationId: org.id } }),
    prisma.user.count({
      where: { id: { in: userIds }, onboarded: true },
    }),
    prisma.user.groupBy({
      by: ["role"],
      where: { id: { in: userIds } },
      _count: true,
    }),
    prisma.commuteSchedule.findMany({
      where: { userId: { in: userIds }, active: true },
      select: {
        destLabel: true,
        originLabel: true,
        type: true,
      },
    }),
    prisma.match.findMany({
      where: {
        status: "accepted",
        OR: [
          { riderSchedule: { userId: { in: userIds } } },
          { driverSchedule: { userId: { in: userIds } } },
        ],
      },
      select: { id: true, distanceMiles: true },
    }),
    prisma.ride.findMany({
      where: {
        status: "completed",
        match: {
          OR: [
            { riderSchedule: { userId: { in: userIds } } },
            { driverSchedule: { userId: { in: userIds } } },
          ],
        },
      },
      select: { date: true, match: { select: { distanceMiles: true } } },
    }),
  ]);

  const roles = { rider: 0, driver: 0, both: 0 };
  for (const g of roleGroups) {
    if (g.role in roles) roles[g.role as keyof typeof roles] = g._count;
  }

  const milesShared = completedRides.reduce(
    (sum, r) => sum + r.match.distanceMiles,
    0
  );
  const co2AvoidedKg = co2SavedKg(milesShared);
  const soloTripsAvoided = completedRides.length;
  const estimatedParkingSpacesFreed = Math.max(
    0,
    acceptedMatches.length - schedules.filter((s) => s.type === "driver").length
  );

  const destCounts = new Map<string, number>();
  const originCounts = new Map<string, number>();
  for (const s of schedules) {
    destCounts.set(s.destLabel, (destCounts.get(s.destLabel) ?? 0) + 1);
    originCounts.set(s.originLabel, (originCounts.get(s.originLabel) ?? 0) + 1);
  }

  const topDestinations = [...destCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  const topOrigins = [...originCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  const weekCounts = new Map<string, number>();
  const eightWeeksAgo = startOfWeek(new Date());
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 7 * 7);
  for (let i = 0; i < 8; i++) {
    const w = new Date(eightWeeksAgo);
    w.setDate(eightWeeksAgo.getDate() + i * 7);
    weekCounts.set(w.toISOString().slice(0, 10), 0);
  }
  for (const ride of completedRides) {
    const key = startOfWeek(ride.date).toISOString().slice(0, 10);
    if (weekCounts.has(key)) {
      weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1);
    }
  }
  const weeklyCompletedRides = [...weekCounts.entries()].map(
    ([week, count]) => ({ week, count })
  );

  return {
    organization: {
      slug: org.slug,
      name: org.name,
      type: org.type,
      description: org.description,
      region: org.region,
    },
    program: program
      ? { name: program.name, slug: program.slug, status: program.status }
      : null,
    overview: {
      enrolledCommuters,
      onboardedCommuters,
      activeSchedules: schedules.length,
      acceptedMatches: acceptedMatches.length,
      completedRides: completedRides.length,
      milesShared: Math.round(milesShared * 10) / 10,
      co2AvoidedKg: Math.round(co2AvoidedKg * 10) / 10,
      soloTripsAvoided,
      estimatedParkingSpacesFreed,
    },
    roles,
    topDestinations,
    topOrigins,
    weeklyCompletedRides,
  };
}
