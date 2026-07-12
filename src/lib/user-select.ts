/** Fields safe to show about another commuter (no email, phone, or password). */
export const publicUserSelect = {
  id: true,
  name: true,
  bio: true,
  verified: true,
  prefQuietRide: true,
  prefMusicOk: true,
  venmoHandle: true,
} as const;

/** Fields for the signed-in user's own account (never includes passwordHash). */
export const ownUserSelect = {
  id: true,
  email: true,
  emailDomain: true,
  verified: true,
  name: true,
  role: true,
  bio: true,
  prefQuietRide: true,
  prefMusicOk: true,
  venmoHandle: true,
  emergencyName: true,
  emergencyPhone: true,
  onboarded: true,
  createdAt: true,
  schedules: {
    where: { active: true },
  },
  clusters: {
    include: { cluster: true },
  },
} as const;

/** Minimal sender info for chat bubbles. */
export const messageSenderSelect = {
  id: true,
  name: true,
} as const;
