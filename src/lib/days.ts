// Day-of-week bitmask: Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAYS_MASK = 0b0011111; // Mon–Fri

export function dayBit(index: number): number {
  return 1 << index;
}

/** Convert a JS Date's getDay() (Sun=0) to our bitmask bit index (Mon=0). */
export function jsDayToIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

export function maskToLabels(mask: number): string[] {
  return DAY_LABELS.filter((_, i) => mask & dayBit(i));
}

export function formatDays(mask: number): string {
  if (mask === WEEKDAYS_MASK) return "Mon–Fri";
  if (mask === 0b1111111) return "Every day";
  return maskToLabels(mask).join(", ");
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** YYYY-MM-DD key for a date in local time. */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Store ride dates as UTC midnight of the calendar day. */
export function keyToUtcDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}
