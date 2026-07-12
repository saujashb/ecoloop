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
- Prisma 6 + PostgreSQL (Neon)
- Custom email/password auth (bcrypt + JWT session cookie via `jose`)
- Leaflet + OpenStreetMap tiles, Nominatim geocoding (no API keys needed)

## Getting started

```bash
npm install
cp .env.example .env          # fill in real values — never commit .env
npx prisma db push
npm run db:seed               # requires SEED_DEMO_PASSWORD in .env
npm run dev                   # http://localhost:3000
```

## Environment variables

Copy `.env.example` to `.env` and set:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon pooled URL recommended) |
| `SESSION_SECRET` | Yes | JWT signing secret for user sessions (`openssl rand -base64 32`) |
| `DEV_ADMIN_SECRET` | No | Enables password-protected `/dev` dashboard; leave unset to disable |
| `SEED_DEMO_PASSWORD` | Seed only | Password for demo accounts created by `npm run db:seed` |

No `NEXT_PUBLIC_*` variables are used — nothing sensitive is exposed to the browser bundle.

## Demo accounts

After seeding, demo logins use the password from your `SEED_DEMO_PASSWORD` env var (not hardcoded):

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

## Security

- **Secrets live in environment variables only** — see `.env.example` for the full list.
- **`.env` is gitignored** — only `.env.example` (placeholders) is committed.
- **No `NEXT_PUBLIC_*` or `REACT_APP_*` vars** — JWT secrets, DB URLs, and admin passwords are server-side only.
- **Auth errors are generic** — login failures return "Invalid email or password", never token or hash details.
- **Seed script does not log passwords** — demo credentials use `SEED_DEMO_PASSWORD` from env.

### Rotate secrets if they were ever hardcoded

Earlier commits contained development fallback strings and a hardcoded seed password (`ecoloop123`, `ecoloop-dev-secret-change-in-production`, `ecoloop-dev-admin`). **If this repo was ever public or shared, rotate immediately:**

1. `SESSION_SECRET` — invalidates all user sessions
2. `DEV_ADMIN_SECRET` — invalidates dev dashboard access
3. `SEED_DEMO_PASSWORD` / demo user passwords — re-run seed or reset demo accounts
4. `DATABASE_URL` password — rotate in Neon if the connection string was ever exposed

Treat anything that appeared in git history as compromised even after removal from the current code.
