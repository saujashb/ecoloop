import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { findMatchesForUser, generateRides } from "../src/lib/matching";
import { dateKey, keyToUtcDate, jsDayToIndex, dayBit } from "../src/lib/days";

const PASSWORD = "ecoloop123";
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

async function main() {
  console.log("Clearing existing data...");
  await prisma.message.deleteMany();
  await prisma.ride.deleteMany();
  await prisma.match.deleteMany();
  await prisma.clusterMember.deleteMany();
  await prisma.commuteSchedule.deleteMany();
  await prisma.cluster.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating clusters...");
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

  console.log("Creating users and schedules...");
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
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

  console.log("Running matching engine...");
  for (const id of usersByEmail.values()) {
    await findMatchesForUser(id);
  }
  const proposalCount = await prisma.match.count();
  console.log(`Created ${proposalCount} match proposals.`);

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
    console.log("Accepting demo match (Maya <-> Alex) and generating rides...");
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
  } else {
    console.warn("Demo match not found — check matching thresholds.");
  }

  console.log("Seed complete.");
  console.log(`Demo rider:  maya@ncsu.edu / ${PASSWORD}`);
  console.log(`Demo driver: alex.chen@cisco.com / ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
