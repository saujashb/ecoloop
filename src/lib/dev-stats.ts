import { prisma } from "./db";

export type DevStats = {
  overview: {
    totalUsers: number;
    onboardedUsers: number;
    verifiedUsers: number;
    signupsToday: number;
    signupsThisWeek: number;
    totalSchedules: number;
    riderSchedules: number;
    driverSchedules: number;
    totalMatches: number;
    acceptedMatches: number;
    totalRides: number;
    completedRides: number;
    totalMessages: number;
    clusterJoins: number;
  };
  roles: { rider: number; driver: number; both: number };
  matchStatuses: { status: string; count: number }[];
  rideStatuses: { status: string; count: number }[];
  topDomains: { domain: string; count: number }[];
  signupsByDay: { date: string; count: number }[];
  recentUsers: {
    id: string;
    name: string;
    email: string;
    role: string;
    verified: boolean;
    onboarded: boolean;
    emailDomain: string;
    scheduleTypes: string[];
    matchCount: number;
    createdAt: Date;
  }[];
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek() {
  const d = startOfToday();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday start
  d.setDate(d.getDate() - diff);
  return d;
}

export async function getDevStats(): Promise<DevStats> {
  const today = startOfToday();
  const weekStart = startOfWeek();
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

  const [
    totalUsers,
    onboardedUsers,
    verifiedUsers,
    signupsToday,
    signupsThisWeek,
    totalSchedules,
    riderSchedules,
    driverSchedules,
    totalMatches,
    acceptedMatches,
    totalRides,
    completedRides,
    totalMessages,
    clusterJoins,
    roleGroups,
    matchGroups,
    rideGroups,
    domainGroups,
    recentUsersRaw,
    usersLast14Days,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { onboarded: true } }),
    prisma.user.count({ where: { verified: true } }),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.commuteSchedule.count({ where: { active: true } }),
    prisma.commuteSchedule.count({ where: { active: true, type: "rider" } }),
    prisma.commuteSchedule.count({ where: { active: true, type: "driver" } }),
    prisma.match.count(),
    prisma.match.count({ where: { status: "accepted" } }),
    prisma.ride.count(),
    prisma.ride.count({ where: { status: "completed" } }),
    prisma.message.count(),
    prisma.clusterMember.count(),
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.match.groupBy({ by: ["status"], _count: true }),
    prisma.ride.groupBy({ by: ["status"], _count: true }),
    prisma.user.groupBy({
      by: ["emailDomain"],
      _count: true,
      orderBy: { _count: { emailDomain: "desc" } },
      take: 8,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        schedules: { where: { active: true }, select: { type: true } },
        _count: {
          select: {
            schedules: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const roles = { rider: 0, driver: 0, both: 0 };
  for (const g of roleGroups) {
    if (g.role in roles) roles[g.role as keyof typeof roles] = g._count;
  }

  // Build per-day signup counts for last 14 days
  const dayCounts = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(fourteenDaysAgo);
    d.setDate(fourteenDaysAgo.getDate() + i);
    dayCounts.set(d.toISOString().slice(0, 10), 0);
  }
  for (const u of usersLast14Days) {
    const key = u.createdAt.toISOString().slice(0, 10);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }
  const signupsByDay = [...dayCounts.entries()].map(([date, count]) => ({
    date,
    count,
  }));

  // Match counts per user (rider or driver side)
  const userIds = recentUsersRaw.map((u) => u.id);

  const riderMatchCounts = userIds.length
    ? await prisma.match.groupBy({
        by: ["riderScheduleId"],
        where: { riderSchedule: { userId: { in: userIds } } },
        _count: true,
      })
    : [];
  const driverMatchCounts = userIds.length
    ? await prisma.match.groupBy({
        by: ["driverScheduleId"],
        where: { driverSchedule: { userId: { in: userIds } } },
        _count: true,
      })
    : [];

  const scheduleToUser = new Map<string, string>();
  const schedules = await prisma.commuteSchedule.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, userId: true },
  });
  for (const s of schedules) scheduleToUser.set(s.id, s.userId);

  const userMatchTotals = new Map<string, number>();
  for (const u of userIds) userMatchTotals.set(u, 0);
  for (const m of riderMatchCounts) {
    const uid = scheduleToUser.get(m.riderScheduleId);
    if (uid) userMatchTotals.set(uid, (userMatchTotals.get(uid) ?? 0) + m._count);
  }
  for (const m of driverMatchCounts) {
    const uid = scheduleToUser.get(m.driverScheduleId);
    if (uid) userMatchTotals.set(uid, (userMatchTotals.get(uid) ?? 0) + m._count);
  }

  const recentUsers = recentUsersRaw.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    verified: u.verified,
    onboarded: u.onboarded,
    emailDomain: u.emailDomain,
    scheduleTypes: [...new Set(u.schedules.map((s) => s.type))],
    matchCount: userMatchTotals.get(u.id) ?? 0,
    createdAt: u.createdAt,
  }));

  return {
    overview: {
      totalUsers,
      onboardedUsers,
      verifiedUsers,
      signupsToday,
      signupsThisWeek,
      totalSchedules,
      riderSchedules,
      driverSchedules,
      totalMatches,
      acceptedMatches,
      totalRides,
      completedRides,
      totalMessages,
      clusterJoins,
    },
    roles,
    matchStatuses: matchGroups.map((g) => ({
      status: g.status,
      count: g._count,
    })),
    rideStatuses: rideGroups.map((g) => ({
      status: g.status,
      count: g._count,
    })),
    topDomains: domainGroups.map((g) => ({
      domain: g.emailDomain,
      count: g._count,
    })),
    signupsByDay,
    recentUsers,
  };
}
