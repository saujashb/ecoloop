import { headers } from "next/headers";
import { clientIpFromForwarded } from "./rate-limit";

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    clientIpFromForwarded(h.get("x-forwarded-for")) ||
    h.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
