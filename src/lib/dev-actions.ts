"use server";

import { redirect } from "next/navigation";
import {
  createDevSession,
  destroyDevSession,
  isDevDashboardEnabled,
  verifyDevPassword,
} from "./dev-auth";
import { checkRateLimit } from "./rate-limit";
import { getClientIp } from "./request";

export type DevFormState = { error?: string } | undefined;

export async function devLogin(
  _prev: DevFormState,
  formData: FormData
): Promise<DevFormState> {
  if (!isDevDashboardEnabled()) {
    return { error: "Dev dashboard is not available." };
  }

  const ip = await getClientIp();
  const { ok, retryAfterSec } = checkRateLimit(
    `action:dev-login:${ip}`,
    5,
    60_000
  );
  if (!ok) {
    return {
      error: `Too many attempts. Try again in ${retryAfterSec} seconds.`,
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!verifyDevPassword(password)) {
    return { error: "Invalid dev password." };
  }
  await createDevSession();
  redirect("/dev");
}

export async function devLogout() {
  await destroyDevSession();
  redirect("/dev/login");
}
