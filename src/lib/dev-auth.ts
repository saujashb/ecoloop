import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { sessionCookieOptions } from "./cookies";
import { requireEnv } from "./env";

const COOKIE_NAME = "cadence_dev_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

function devSecret() {
  return new TextEncoder().encode(requireEnv("DEV_ADMIN_SECRET"));
}

export function isDevDashboardEnabled(): boolean {
  return Boolean(process.env.DEV_ADMIN_SECRET?.trim());
}

export async function createDevSession() {
  const token = await new SignJWT({ role: "dev_admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(devSecret());
  (await cookies()).set(COOKIE_NAME, token, sessionCookieOptions("/dev", MAX_AGE));
}

export async function destroyDevSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function isDevAuthenticated(): Promise<boolean> {
  if (!isDevDashboardEnabled()) return false;
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, devSecret());
    return payload.role === "dev_admin";
  } catch {
    return false;
  }
}

export async function requireDevAuth(): Promise<void> {
  if (!isDevDashboardEnabled()) {
    notFound();
  }
  const ok = await isDevAuthenticated();
  if (!ok) redirect("/dev/login");
}

export function verifyDevPassword(password: string): boolean {
  const secret = process.env.DEV_ADMIN_SECRET?.trim();
  if (!secret) return false;
  return password === secret;
}
