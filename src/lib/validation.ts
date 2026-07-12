const MAX_NAME = 120;
const MAX_BIO = 500;
const MAX_VENMO = 64;
const MAX_PHONE = 32;
const MAX_EMERGENCY_NAME = 120;
const MAX_MESSAGE = 2000;
const MAX_LABEL = 300;

export function clampString(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export function sanitizeVenmoHandle(value: string): string | null {
  const handle = value.trim().replace(/^@/, "").slice(0, MAX_VENMO);
  if (!handle) return null;
  if (!/^[a-zA-Z0-9._-]+$/.test(handle)) return null;
  return handle;
}

export function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function clampSeats(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(4, Math.max(1, Math.round(value)));
}

export function clampDaysMask(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value & 0b01111111;
}

export function isValidTimeHHMM(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function sanitizeMessageBody(value: string): string | null {
  const body = value.replace(/\0/g, "").trim().slice(0, MAX_MESSAGE);
  return body.length > 0 ? body : null;
}

/** Prisma cuid-style IDs used across the schema. */
export function isValidResourceId(value: string): boolean {
  return /^[a-z0-9]{20,32}$/i.test(value.trim());
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export const limits = {
  MAX_NAME,
  MAX_BIO,
  MAX_MESSAGE,
  MAX_LABEL,
  MAX_PHONE,
  MAX_EMERGENCY_NAME,
};
