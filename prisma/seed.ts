import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { findMatchesForUser, generateRides } from "../src/lib/matching";
import { dateKey, keyToUtcDate, jsDayToIndex, dayBit } from "../src/lib/days";

function requireSeedPassword(): string {
  const value = process.env.SEED_DEMO_PASSWORD?.trim();
  if (!value) {
    throw new Error(
      "Missing SEED_DEMO_PASSWORD — set it in .env before running db:seed."
    );
  }
  return value;
}
const WEEKDAYS = 0b0011111; // Mon–Fri

// Research Triangle Park pilot area
const CISCO_RTP = {
  lat: 35.8386,
  lng: -78.876,
  label: "Cisco Campus, Research Triangle Park, NC",
};

const seedUsers = [
  {
    name: "Maya Patel",
    email: "maya@ncsu.edu",
    role: "rider",
    bio: "NC State CS student, summer SWE intern at Cisco. New to the area!",
    origin: { lat: 35.8235, lng: -78.8256, label: "Town Hall Dr, Morrisville, NC" },
    arriveStart: "08:15",
    arriveEnd: "08:45",
    prefQuietRide: false,
    prefMusicOk: true,
    clusters: ["RTP Interns"],
  },
  {
    name: "Alex Chen",
    email: "alex.chen@cisco.com",
    role: "driver",
    bio: "Full-time network engineer at Cisco. Happy to share my daily drive from Cary.",
    origin: { lat: 35.7915, lng: -78.7811, label: "Kildaire Farm Rd, Cary, NC" },
    arriveStart: "08:15",
    arriveEnd: "08:45",
    seats: 3,
    venmoHandle: "alex-chen-rides",
    prefQuietRide: false,
    prefMusicOk: true,
    clusters: ["RTP Interns"],
  },
  {
    name: "Jordan Brooks",
    email: "jbrooks@ibm.com",
    role: "driver",
    bio: "IBM PM commuting from South Durham every weekday. Podcast person.",
    origin: { lat: 35.931, lng: -78.911, label: "Fayetteville Rd, Durham, NC" },
    arriveStart: "08:30",
    arriveEnd: "09:00",
    seats: 2,
    venmoHandle: "jordan-brooks-9",
    prefQuietRide: true,
    prefMusicOk: false,
    clusters: [],
  },
  {
    name: "Sam Okafor",
    email: "sokafor@unc.edu",
    role: "driver",
    bio: "Grad student TA, drives from Apex to an RTP co-op M/W/F.",
    origin: { lat: 35.7327, lng: -78.8503, label: "Salem St, Apex, NC" },
    arriveStart: "07:45",
    arriveEnd: "08:15",
    seats: 2,
    venmoHandle: "sam-okafor",
    days: 0b0010101, // Mon, Wed, Fri
    prefQuietRide: false,
    prefMusicOk: true,
    clusters: ["RTP Interns"],
  },
  {
    name: "Priya Nair",
    email: "priya@duke.edu",
    role: "rider",
    bio: "Duke biomedical intern at RTP labs. Looking for a consistent morning ride.",
    origin: { lat: 35.8436, lng: -78.705, label: "Glenwood Ave, Raleigh, NC" },
    arriveStart: "08:30",
    arriveEnd: "09:00",
    prefQuietRide: true,
    prefMusicOk: true,
    clusters: ["RTP Interns"],
  },
  {
    name: "Diego Ramirez",
    email: "dramirez@ncsu.edu",
    role: "rider",
    bio: "Data analytics co-op, carless in Cary. Coffee enthusiast.",
    origin: { lat: 35.7847, lng: -78.7997, label: "Walnut St, Cary, NC" },
    arriveStart: "08:00",
    arriveEnd: "08:30",
    prefQuietRide: false,
    prefMusicOk: true,
    clusters: ["RTP Interns"],
  },
  {
    name: "Emma Liu",
    email: "emma.liu@ti.com",
    role: "both",
    bio: "TI hardware engineer. Drive most days, happy to ride when my car's in the shop.",
    origin: { lat: 35.9049, lng: -78.94, label: "MLK Jr Blvd, Chapel Hill, NC" },
    arriveStart: "08:45",
    arriveEnd: "09:15",
    seats: 2,
    venmoHandle: "emma-liu-tx",
    prefQuietRide: false,
    prefMusicOk: true,
    clusters: [],
  },
  {
    name: "Noah Green",
    email: "noahgreen@gmail.com",
    role: "driver",
    bio: "Contractor near RTP, flexible mornings.",
    origin: { lat: 35.8646, lng: -78.8386, label: "Page Rd, Morrisville, NC" },
    arriveStart: "08:00",
    arriveEnd: "08:45",
    seats: 3,
    venmoHandle: "noah-green-rtp",
    prefQuietRide: false,
    prefMusicOk: true,
    clusters: [],
  },
] as const;

async function seedPartnerOrganizations() {
  const gotriangle = await prisma.organization.upsert({
    where: { slug: "gotriangle" },
    update: {
      description:
        "Regional transit and TDM partner for the Research Triangle. EcoLoop complements fixed-route service and RTP Connect with recurring carpool matching for carless early-career commuters.",
    },
    create: {
      slug: "gotriangle",
      name: "GoTriangle",
      type: "transit_agency",
      description:
        "Regional transit and TDM partner for the Research Triangle. EcoLoop complements fixed-route service and RTP Connect with recurring carpool matching for carless early-career commuters.",
      region: "Research Triangle, NC",
      website: "https://gotriangle.org",
      contactEmail: "commute@rtp.org",
    },
  });

  const program = await prisma.program.upsert({
    where: {
      organizationId_slug: {
        organizationId: gotriangle.id,
        slug: "rtp-intern-commute-2026",
      },
    },
    update: {},
    create: {
      organizationId: gotriangle.id,
      slug: "rtp-intern-commute-2026",
      name: "RTP Recurring Carpool Pilot",
      description:
        "Summer 2026 pilot matching carless interns with drivers on existing RTP corridors.",
      status: "pilot",
    },
  });

  await prisma.organization.upsert({
    where: { slug: "cisco-rtp" },
    update: {},
    create: {
      slug: "cisco-rtp",
      name: "Cisco RTP",
      type: "employer",
      description: "Employer program for summer interns commuting to Cisco RTP campus.",
      region: "Research Triangle Park, NC",
      website: "https://www.cisco.com",
    },
  });

  return { gotriangleId: gotriangle.id, programId: program.id };
}

async function enrollUsersInGoTriangle(
  userIds: Iterable<string>,
  gotriangleId: string,
  programId: string
) {
  for (const userId of userIds) {
    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: { userId, organizationId: gotriangleId },
      },
      create: {
        userId,
        organizationId: gotriangleId,
        programId,
        role: "commuter",
      },
      update: { programId },
    });
  }
}

async function upsertDemoUsers(passwordHash: string) {
  const { gotriangleId, programId } = await seedPartnerOrganizations();
  const clusters = await Promise.all(
    [
      {
        name: "RTP Interns",
        region: "Research Triangle Park, NC",
        description: "Summer interns and co-ops commuting into RTP campuses.",
      },
      {
        name: "DFW Summer Analysts",
        region: "Dallas–Fort Worth, TX",
        description: "Analysts and interns across the DFW metroplex.",
      },
      {
        name: "Coppell Commuters",
        region: "Coppell, TX",
        description: "Daily commuters into Coppell business parks.",
      },
    ].map((c) =>
      prisma.cluster.upsert({
        where: { name: c.name },
        update: { region: c.region, description: c.description },
        create: c,
      })
    )
  );
  const clusterByName = new Map(clusters.map((c) => [c.name, c]));
  const usersByEmail = new Map<string, string>();

  for (const u of seedUsers) {
    const emailDomain = u.email.split("@")[1];
    const verified =
      emailDomain.endsWith(".edu") ||
      ["cisco.com", "ibm.com", "ti.com"].includes(emailDomain);

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        passwordHash,
        role: u.role,
        bio: u.bio,
        prefQuietRide: u.prefQuietRide,
        prefMusicOk: u.prefMusicOk,
        venmoHandle: "venmoHandle" in u ? u.venmoHandle : null,
        onboarded: true,
        verified,
      },
      create: {
        name: u.name,
        email: u.email,
        emailDomain,
        verified,
        passwordHash,
        role: u.role,
        bio: u.bio,
        prefQuietRide: u.prefQuietRide,
        prefMusicOk: u.prefMusicOk,
        venmoHandle: "venmoHandle" in u ? u.venmoHandle : null,
        onboarded: true,
      },
    });
    usersByEmail.set(u.email, user.id);

    await prisma.commuteSchedule.deleteMany({ where: { userId: user.id } });

    const types = u.role === "both" ? ["rider", "driver"] : [u.role];
    for (const type of types) {
      await prisma.commuteSchedule.create({
        data: {
          userId: user.id,
          type,
          originLabel: u.origin.label,
          originLat: u.origin.lat,
          originLng: u.origin.lng,
          destLabel: CISCO_RTP.label,
          destLat: CISCO_RTP.lat,
          destLng: CISCO_RTP.lng,
          arriveStart: u.arriveStart,
          arriveEnd: u.arriveEnd,
          days: "days" in u ? u.days : WEEKDAYS,
          seats: type === "driver" && "seats" in u ? u.seats : 1,
        },
      });
    }

    await prisma.clusterMember.deleteMany({ where: { userId: user.id } });
    for (const clusterName of u.clusters) {
      const cluster = clusterByName.get(clusterName)!;
      await prisma.clusterMember.create({
        data: { userId: user.id, clusterId: cluster.id },
      });
    }
  }

  for (const id of usersByEmail.values()) {
    await findMatchesForUser(id);
  }

  const mayaId = usersByEmail.get("maya@ncsu.edu");
  const alexId = usersByEmail.get("alex.chen@cisco.com");
  if (mayaId && alexId) {
    const demoMatch = await prisma.match.findFirst({
      where: {
        riderSchedule: { userId: mayaId },
        driverSchedule: { userId: alexId },
      },
    });
    if (demoMatch) {
      await prisma.match.update({
        where: { id: demoMatch.id },
        data: { status: "accepted" },
      });
      await generateRides(demoMatch.id);
    }
  }

  await enrollUsersInGoTriangle(usersByEmail.values(), gotriangleId, programId);
}

async function main() {
  const passwordHash = await bcrypt.hash(requireSeedPassword(), 10);

  // Production deploys must not wipe real user accounts.
  if (process.env.NODE_ENV === "production") {
    await upsertDemoUsers(passwordHash);
    return;
  }

  await prisma.message.deleteMany();
  await prisma.ride.deleteMany();
  await prisma.match.deleteMany();
  await prisma.clusterMember.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.commuteSchedule.deleteMany();
  await prisma.program.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.cluster.deleteMany();
  await prisma.user.deleteMany();

  const { gotriangleId, programId } = await seedPartnerOrganizations();

  const clusters = await Promise.all(
    [
      {
        name: "RTP Interns",
        region: "Research Triangle Park, NC",
        description: "Summer interns and co-ops commuting into RTP campuses.",
      },
      {
        name: "DFW Summer Analysts",
        region: "Dallas–Fort Worth, TX",
        description: "Analysts and interns across the DFW metroplex.",
      },
      {
        name: "Coppell Commuters",
        region: "Coppell, TX",
        description: "Daily commuters into Coppell business parks.",
      },
    ].map((c) => prisma.cluster.create({ data: c }))
  );
  const clusterByName = new Map(clusters.map((c) => [c.name, c]));

  const usersByEmail = new Map<string, string>();

  for (const u of seedUsers) {
    const emailDomain = u.email.split("@")[1];
    const verified = emailDomain.endsWith(".edu") ||
      ["cisco.com", "ibm.com", "ti.com"].includes(emailDomain);
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        emailDomain,
        verified,
        passwordHash,
        role: u.role,
        bio: u.bio,
        prefQuietRide: u.prefQuietRide,
        prefMusicOk: u.prefMusicOk,
        venmoHandle: "venmoHandle" in u ? u.venmoHandle : null,
        onboarded: true,
      },
    });
    usersByEmail.set(u.email, user.id);

    const types = u.role === "both" ? ["rider", "driver"] : [u.role];
    for (const type of types) {
      await prisma.commuteSchedule.create({
        data: {
          userId: user.id,
          type,
          originLabel: u.origin.label,
          originLat: u.origin.lat,
          originLng: u.origin.lng,
          destLabel: CISCO_RTP.label,
          destLat: CISCO_RTP.lat,
          destLng: CISCO_RTP.lng,
          arriveStart: u.arriveStart,
          arriveEnd: u.arriveEnd,
          days: "days" in u ? u.days : WEEKDAYS,
          seats: type === "driver" && "seats" in u ? u.seats : 1,
        },
      });
    }

    for (const clusterName of u.clusters) {
      const cluster = clusterByName.get(clusterName)!;
      await prisma.clusterMember.create({
        data: { userId: user.id, clusterId: cluster.id },
      });
    }
  }

  for (const id of usersByEmail.values()) {
    await findMatchesForUser(id);
  }

  // Accept Maya <-> Alex so the demo account has a live commute buddy.
  const mayaId = usersByEmail.get("maya@ncsu.edu")!;
  const alexId = usersByEmail.get("alex.chen@cisco.com")!;
  const demoMatch = await prisma.match.findFirst({
    where: {
      riderSchedule: { userId: mayaId },
      driverSchedule: { userId: alexId },
    },
  });

  if (demoMatch) {
    await prisma.match.update({
      where: { id: demoMatch.id },
      data: { status: "accepted" },
    });
    await generateRides(demoMatch.id);

    // Backfill two weeks of completed rides for the history/impact page.
    const today = new Date();
    for (let offset = 14; offset >= 1; offset--) {
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      const idx = jsDayToIndex(d.getDay());
      if (!(demoMatch.sharedDays & dayBit(idx))) continue;
      await prisma.ride.upsert({
        where: {
          matchId_date: { matchId: demoMatch.id, date: keyToUtcDate(dateKey(d)) },
        },
        update: { status: "completed" },
        create: {
          matchId: demoMatch.id,
          date: keyToUtcDate(dateKey(d)),
          status: "completed",
        },
      });
    }

    await prisma.message.createMany({
      data: [
        {
          matchId: demoMatch.id,
          senderId: alexId,
          body: "Hey Maya! I leave Kildaire Farm around 7:55 — I can grab you at the Park West shops at 8:05.",
        },
        {
          matchId: demoMatch.id,
          senderId: mayaId,
          body: "Perfect, that works every day this week. Thank you!!",
        },
        {
          matchId: demoMatch.id,
          senderId: alexId,
          body: "Sounds good. Silver Honda CR-V, see you tomorrow.",
        },
      ],
    });
  }

  await enrollUsersInGoTriangle(usersByEmail.values(), gotriangleId, programId);
}

main()
  .catch((e) => {
    console.error(
      "Seed failed:",
      e instanceof Error ? e.message : "Unknown error"
    );
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
