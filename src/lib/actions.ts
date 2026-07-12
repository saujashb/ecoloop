"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import {
  createSession,
  destroySession,
  isVerifiedDomain,
  requireUser,
} from "./auth";
import {
  findMatchesForUser,
  generateRides,
} from "./matching";

export type FormState = { error?: string } | undefined;

// ---------- Auth ----------

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email.includes("@") || password.length < 8) {
    return { error: "Please fill all fields (password must be 8+ characters)." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const emailDomain = email.split("@")[1];
  const user = await prisma.user.create({
    data: {
      name,
      email,
      emailDomain,
      verified: isVerifiedDomain(emailDomain),
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  await createSession(user.id);
  redirect("/onboarding");
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect(user.onboarded ? "/dashboard" : "/onboarding");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

// ---------- Onboarding ----------

export type OnboardingPayload = {
  role: "rider" | "driver" | "both";
  seats: number;
  origin: { lat: number; lng: number; label: string };
  dest: { lat: number; lng: number; label: string };
  arriveStart: string;
  arriveEnd: string;
  days: number;
  bio: string;
  prefQuietRide: boolean;
  prefMusicOk: boolean;
  venmoHandle: string;
  emergencyName: string;
  emergencyPhone: string;
};

export async function completeOnboarding(payload: OnboardingPayload) {
  const user = await requireUser();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: payload.role,
      bio: payload.bio || null,
      prefQuietRide: payload.prefQuietRide,
      prefMusicOk: payload.prefMusicOk,
      venmoHandle: payload.venmoHandle || null,
      emergencyName: payload.emergencyName || null,
      emergencyPhone: payload.emergencyPhone || null,
      onboarded: true,
    },
  });

  const scheduleTypes =
    payload.role === "both" ? ["rider", "driver"] : [payload.role];

  for (const type of scheduleTypes) {
    await prisma.commuteSchedule.create({
      data: {
        userId: user.id,
        type,
        originLabel: payload.origin.label,
        originLat: payload.origin.lat,
        originLng: payload.origin.lng,
        destLabel: payload.dest.label,
        destLat: payload.dest.lat,
        destLng: payload.dest.lng,
        arriveStart: payload.arriveStart,
        arriveEnd: payload.arriveEnd,
        days: payload.days,
        seats: type === "driver" ? payload.seats : 1,
      },
    });
  }

  await findMatchesForUser(user.id);
  redirect("/matches");
}

// ---------- Matches ----------

export async function refreshMatches() {
  const user = await requireUser();
  await findMatchesForUser(user.id);
  revalidatePath("/matches");
}

async function assertUserInMatch(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { riderSchedule: true, driverSchedule: true },
  });
  if (
    !match ||
    (match.riderSchedule.userId !== userId &&
      match.driverSchedule.userId !== userId)
  ) {
    throw new Error("Match not found");
  }
  return match;
}

export async function acceptMatch(formData: FormData) {
  const user = await requireUser();
  const matchId = String(formData.get("matchId"));
  await assertUserInMatch(matchId, user.id);
  await prisma.match.update({
    where: { id: matchId },
    data: { status: "accepted" },
  });
  await generateRides(matchId);
  revalidatePath("/matches");
  revalidatePath("/dashboard");
}

export async function declineMatch(formData: FormData) {
  const user = await requireUser();
  const matchId = String(formData.get("matchId"));
  await assertUserInMatch(matchId, user.id);
  await prisma.match.update({
    where: { id: matchId },
    data: { status: "declined" },
  });
  revalidatePath("/matches");
}

export async function endMatch(formData: FormData) {
  const user = await requireUser();
  const matchId = String(formData.get("matchId"));
  await assertUserInMatch(matchId, user.id);
  await prisma.match.update({
    where: { id: matchId },
    data: { status: "ended" },
  });
  await prisma.ride.deleteMany({
    where: { matchId, status: "scheduled", date: { gte: new Date() } },
  });
  revalidatePath("/matches");
  revalidatePath("/dashboard");
}

// ---------- Rides ----------

async function setRideStatus(rideId: string, userId: string, status: string) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      match: { include: { riderSchedule: true, driverSchedule: true } },
    },
  });
  if (
    !ride ||
    (ride.match.riderSchedule.userId !== userId &&
      ride.match.driverSchedule.userId !== userId)
  ) {
    throw new Error("Ride not found");
  }
  await prisma.ride.update({ where: { id: rideId }, data: { status } });
  revalidatePath("/dashboard");
  revalidatePath("/impact");
}

export async function cancelRide(formData: FormData) {
  const user = await requireUser();
  await setRideStatus(String(formData.get("rideId")), user.id, "cancelled");
}

export async function completeRide(formData: FormData) {
  const user = await requireUser();
  await setRideStatus(String(formData.get("rideId")), user.id, "completed");
}

// ---------- Chat ----------

export async function sendMessage(formData: FormData) {
  const user = await requireUser();
  const matchId = String(formData.get("matchId"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await assertUserInMatch(matchId, user.id);
  await prisma.message.create({
    data: { matchId, senderId: user.id, body },
  });
  revalidatePath(`/chat/${matchId}`);
}

// ---------- Clusters ----------

export async function joinCluster(formData: FormData) {
  const user = await requireUser();
  const clusterId = String(formData.get("clusterId"));
  await prisma.clusterMember.upsert({
    where: { userId_clusterId: { userId: user.id, clusterId } },
    update: {},
    create: { userId: user.id, clusterId },
  });
  revalidatePath("/community");
}

export async function leaveCluster(formData: FormData) {
  const user = await requireUser();
  const clusterId = String(formData.get("clusterId"));
  await prisma.clusterMember.deleteMany({
    where: { userId: user.id, clusterId },
  });
  revalidatePath("/community");
}

// ---------- Profile ----------

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: String(formData.get("name") ?? user.name),
      bio: String(formData.get("bio") ?? "") || null,
      venmoHandle: String(formData.get("venmoHandle") ?? "") || null,
      emergencyName: String(formData.get("emergencyName") ?? "") || null,
      emergencyPhone: String(formData.get("emergencyPhone") ?? "") || null,
      prefQuietRide: formData.get("prefQuietRide") === "on",
      prefMusicOk: formData.get("prefMusicOk") === "on",
    },
  });
  revalidatePath("/profile");
}

export async function updateSchedule(formData: FormData) {
  const user = await requireUser();
  const scheduleId = String(formData.get("scheduleId"));
  const schedule = await prisma.commuteSchedule.findUnique({
    where: { id: scheduleId },
  });
  if (!schedule || schedule.userId !== user.id) throw new Error("Not found");

  let days = 0;
  for (let i = 0; i < 7; i++) {
    if (formData.get(`day${i}`) === "on") days |= 1 << i;
  }
  if (days === 0) days = schedule.days;

  await prisma.commuteSchedule.update({
    where: { id: scheduleId },
    data: {
      arriveStart: String(formData.get("arriveStart") ?? schedule.arriveStart),
      arriveEnd: String(formData.get("arriveEnd") ?? schedule.arriveEnd),
      days,
      seats: Number(formData.get("seats") ?? schedule.seats) || schedule.seats,
    },
  });
  revalidatePath("/profile");
}
