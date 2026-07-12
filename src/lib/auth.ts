import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "./db";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "ecoloop-dev-secret-change-in-production"
);
const COOKIE_NAME = "ecoloop_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

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
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

export const getCurrentUser = cache(async () => {
  const id = await getSessionUserId();
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
    include: {
      schedules: { where: { active: true } },
      clusters: { include: { cluster: true } },
    },
  });
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
