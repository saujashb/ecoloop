export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_MILES = 3958.8;

export function haversineMiles(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

/**
 * Approximate distance (miles) from point p to the segment a->b using a local
 * equirectangular projection. Good enough at commute scale (< 50 miles).
 */
export function pointToSegmentMiles(p: LatLng, a: LatLng, b: LatLng): number {
  const refLat = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  const milesPerDegLat = 69.0;
  const milesPerDegLng = 69.0 * Math.cos(refLat);
  const toXY = (q: LatLng) => ({
    x: q.lng * milesPerDegLng,
    y: q.lat * milesPerDegLat,
  });
  const P = toXY(p);
  const A = toXY(a);
  const B = toXY(b);
  const ABx = B.x - A.x;
  const ABy = B.y - A.y;
  const lenSq = ABx * ABx + ABy * ABy;
  let t = lenSq === 0 ? 0 : ((P.x - A.x) * ABx + (P.y - A.y) * ABy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = A.x + t * ABx;
  const cy = A.y + t * ABy;
  return Math.sqrt((P.x - cx) ** 2 + (P.y - cy) ** 2);
}

/** Suggested flat fare in cents: $3 base + $0.45/mile, clamped to $3–$8. */
export function suggestedFareCents(tripMiles: number): number {
  const raw = 300 + tripMiles * 45;
  return Math.round(Math.min(800, Math.max(300, raw)));
}

/** Rough Uber estimate in cents for comparison: base + per-mile, min $8.50. */
export function uberEstimateCents(tripMiles: number): number {
  return Math.round(Math.max(850, 550 + tripMiles * 190));
}

/** EPA average: ~404g CO2 per passenger-car mile avoided by sharing a ride. */
export function co2SavedKg(tripMiles: number): number {
  return tripMiles * 0.404;
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
