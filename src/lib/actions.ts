"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import {
  createSession,
  destroySession,
  getCurrentUser,
  isVerifiedDomain,
  requireUser,
  revokeAllSessions,
} from "./auth";
import {
  findMatchesForUser,
  generateRides,
} from "./matching";
import { failSafe } from "./errors";
import { checkRateLimit } from "./rate-limit";
import { getClientIp } from "./request";
import {
  clampDaysMask,
  clampSeats,
  clampString,
  isValidLatLng,
  isValidTimeHHMM,
  limits,
  sanitizeMessageBody,
  sanitizeVenmoHandle,
} from "./validation";

export type FormState = { error?: string } | undefined;

const AUTH_LIMIT = 5;
const AUTH_WINDOW_MS = 60_000;

async function enforceAuthRateLimit(action: string): Promise<FormState | undefined> {
  const ip = await getClientIp();
  const { ok, retryAfterSec } = checkRateLimit(
    `action:${action}:${ip}`,
    AUTH_LIMIT,
    AUTH_WINDOW_MS
  );
  if (!ok) {
    return {
      error: `Too many attempts. Try again in ${retryAfterSec} seconds.`,
    };
  }
  return undefined;
}

// ---------- Auth ----------

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const rateLimited = await enforceAuthRateLimit("signup");
  if (rateLimited) return rateLimited;

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email.includes("@") || password.length < 8) {
    return { error: "Please fill all fields (password must be 8+ characters)." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Invalid email or password." };

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
  const rateLimited = await enforceAuthRateLimit("login");
  if (rateLimited) return rateLimited;

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
  const user = await getCurrentUser();
  if (user) await revokeAllSessions(user.id);
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

  if (!["rider", "driver", "both"].includes(payload.role)) {
    failSafe("completeOnboarding: invalid role");
  }
  if (
    !isValidLatLng(payload.origin.lat, payload.origin.lng) ||
    !isValidLatLng(payload.dest.lat, payload.dest.lng)
  ) {
    failSafe("completeOnboarding: invalid coordinates");
  }
  if (!isValidTimeHHMM(payload.arriveStart) || !isValidTimeHHMM(payload.arriveEnd)) {
    failSafe("completeOnboarding: invalid time window");
  }
  if (payload.arriveStart >= payload.arriveEnd) {
    failSafe("completeOnboarding: inverted time window");
  }

  const days = clampDaysMask(payload.days);
  if (days === 0) failSafe("completeOnboarding: no commute days");

  const seats = clampSeats(payload.seats);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: payload.role,
      bio: clampString(payload.bio, limits.MAX_BIO) || null,
      prefQuietRide: payload.prefQuietRide,
      prefMusicOk: payload.prefMusicOk,
      venmoHandle: sanitizeVenmoHandle(payload.venmoHandle),
      emergencyName: clampString(payload.emergencyName, limits.MAX_EMERGENCY_NAME) || null,
      emergencyPhone: clampString(payload.emergencyPhone, limits.MAX_PHONE) || null,
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
        originLabel: clampString(payload.origin.label, limits.MAX_LABEL),
        originLat: payload.origin.lat,
        originLng: payload.origin.lng,
        destLabel: clampString(payload.dest.label, limits.MAX_LABEL),
        destLat: payload.dest.lat,
        destLng: payload.dest.lng,
        arriveStart: payload.arriveStart,
        arriveEnd: payload.arriveEnd,
        days,
        seats: type === "driver" ? seats : 1,
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
    failSafe("assertUserInMatch: unauthorized or missing match");
  }
  return match!;
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
    failSafe("setRideStatus: unauthorized or missing ride");
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
  const body = sanitizeMessageBody(String(formData.get("body") ?? ""));
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
      name: clampString(String(formData.get("name") ?? user.name), limits.MAX_NAME),
      bio: clampString(String(formData.get("bio") ?? ""), limits.MAX_BIO) || null,
      venmoHandle: sanitizeVenmoHandle(String(formData.get("venmoHandle") ?? "")),
      emergencyName:
        clampString(String(formData.get("emergencyName") ?? ""), limits.MAX_EMERGENCY_NAME) ||
        null,
      emergencyPhone: clampString(String(formData.get("emergencyPhone") ?? ""), limits.MAX_PHONE) || null,
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
  if (!schedule || schedule.userId !== user.id) {
    failSafe("updateSchedule: unauthorized or missing schedule");
  }

  let days = 0;
  for (let i = 0; i < 7; i++) {
    if (formData.get(`day${i}`) === "on") days |= 1 << i;
  }
  days = clampDaysMask(days === 0 ? schedule.days : days);

  const arriveStart = String(formData.get("arriveStart") ?? schedule.arriveStart);
  const arriveEnd = String(formData.get("arriveEnd") ?? schedule.arriveEnd);
  if (!isValidTimeHHMM(arriveStart) || !isValidTimeHHMM(arriveEnd) || arriveStart >= arriveEnd) {
    failSafe("updateSchedule: invalid schedule window");
  }

  await prisma.commuteSchedule.update({
    where: { id: scheduleId },
    data: {
      arriveStart,
      arriveEnd,
      days,
      seats: schedule.type === "driver" ? clampSeats(Number(formData.get("seats") ?? schedule.seats)) : 1,
    },
  });
  revalidatePath("/profile");
}

export async function deleteAccount(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== "DELETE") {
    return { error: "Type DELETE to confirm account removal." };
  }

  await revokeAllSessions(user.id);
  await destroySession();
  await prisma.user.delete({ where: { id: user.id } });
  redirect("/");
}
