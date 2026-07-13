import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "./db";
import { sessionCookieOptions } from "./cookies";
import { requireEnv } from "./env";
import { ownUserSelect } from "./user-select";

const COOKIE_NAME = "cadence_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function sessionSecret() {
  return new TextEncoder().encode(requireEnv("SESSION_SECRET"));
}

// Domains of companies common in our pilot regions; .edu is always verified.
const KNOWN_COMPANY_DOMAINS = new Set([
  "cisco.com",
  "ti.com",
  "amazon.com",
  "google.com",
  "microsoft.com",
  "ibm.com",
  "apple.com",
  "dell.com",
  "fidelity.com",
  "att.com",
  "verizon.com",
  "deloitte.com",
  "capitalone.com",
  "bankofamerica.com",
]);

export function isVerifiedDomain(domain: string): boolean {
  return domain.endsWith(".edu") || KNOWN_COMPANY_DOMAINS.has(domain);
}

export async function createSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionVersion: true },
  });
  if (!user) return;

  const token = await new SignJWT({
    sub: userId,
    sv: user.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(sessionSecret());
  (await cookies()).set(COOKIE_NAME, token, sessionCookieOptions("/", MAX_AGE));
}

export async function revokeAllSessions(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    const userId = payload.sub as string | undefined;
    const sessionVersion = payload.sv as number | undefined;
    if (!userId || sessionVersion === undefined) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sessionVersion: true },
    });
    if (!user || user.sessionVersion !== sessionVersion) return null;

    return userId;
  } catch {
    return null;
  }
}

export const getCurrentUser = cache(async () => {
  const id = await getSessionUserId();
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
    select: ownUserSelect,
  });
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
