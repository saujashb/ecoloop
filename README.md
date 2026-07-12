# EcoLoop

Community-powered commuting. EcoLoop matches riders (interns, students, early-career
professionals) with drivers already making the same daily commute — recurring,
pre-scheduled, zero-detour rides at a flat fare.

## Features

- **Recurring commute scheduling** — set origin, destination, arrival window, and days once
- **Matching engine** — pairs riders with drivers by day overlap, arrival-window overlap,
  destination proximity, and a zero-detour corridor check; scores by fit and shared clusters
- **Match proposals** — accept/decline cards; accepting auto-generates upcoming rides
- **Dashboard** — today's ride, next 7 days, cancel/complete actions, Venmo pay link
- **Trust layer** — instant verification for `.edu`/known company email domains, bios,
  ride preferences, emergency contact
- **Community feed** — nearby commuters and joinable micro-clusters (e.g. "RTP Interns")
- **Per-match chat** — lightweight message threads with auto-refresh
- **Impact page** — ride history, money saved vs. Uber, CO2 avoided
- **Payments out of app** — suggested flat fare ($3–8 by distance) paid rider→driver via Venmo

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS 4
- Prisma 6 + SQLite (swap `datasource` to Postgres for production)
- Custom email/password auth (bcrypt + JWT session cookie via `jose`)
- Leaflet + OpenStreetMap tiles, Nominatim geocoding (no API keys needed)

## Getting started

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db
npm run db:seed          # demo users, matches, and ride history
npm run dev              # http://localhost:3000
```

## Demo accounts

All seeded accounts use the password `ecoloop123`:

| Email | Role |
| --- | --- |
| `maya@ncsu.edu` | Rider with an active commute buddy, chat, and ride history |
| `alex.chen@cisco.com` | Driver matched with Maya |
| `jbrooks@ibm.com`, `sokafor@unc.edu`, `noahgreen@gmail.com` | Drivers with open proposals |
| `priya@duke.edu`, `dramirez@ncsu.edu`, `emma.liu@ti.com` | Riders / both |

The seed data simulates the Research Triangle Park (NC) pilot: homes in Cary,
Morrisville, Apex, Durham, Raleigh, and Chapel Hill commuting to the Cisco RTP campus.

## Project layout

- `prisma/schema.prisma` — User, CommuteSchedule, Match, Ride, Cluster, Message
- `src/lib/matching.ts` — matching engine and ride generation
- `src/lib/geo.ts` — haversine/corridor math, fare, Uber estimate, CO2 formulas
- `src/lib/actions.ts` — all server actions (auth, onboarding, matches, rides, chat)
- `src/app/(app)/` — authenticated app (dashboard, matches, community, impact, chat, profile)
- `src/components/LocationPicker.tsx` — Leaflet map + Nominatim search picker

## Dev dashboard

Password-protected pilot metrics at **`/dev`** (not linked from the public app).

Set `DEV_ADMIN_SECRET` in your environment, then visit `/dev/login`.

Tracks: new signups, rider/driver/both breakdown, onboarded vs incomplete, match and ride counts, signups chart (14 days), top email domains, and a full accounts table.

`.env` (created by `prisma init`):

```
DATABASE_URL="file:./dev.db"
```

Optionally set `SESSION_SECRET` for signing session tokens (a dev fallback is used otherwise).
