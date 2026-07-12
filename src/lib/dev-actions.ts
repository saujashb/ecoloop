"use server";

import { redirect } from "next/navigation";
import {
  createDevSession,
  destroyDevSession,
  isDevDashboardEnabled,
  verifyDevPassword,
} from "./dev-auth";

export type DevFormState = { error?: string } | undefined;

export async function devLogin(
  _prev: DevFormState,
  formData: FormData
): Promise<DevFormState> {
  if (!isDevDashboardEnabled()) {
    return { error: "Dev dashboard is disabled. Set DEV_ADMIN_SECRET." };
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
