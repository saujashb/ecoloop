# Cadence

**B2B2C institutional commute programs** for transit agencies and employers.
Cadence matches carless early-career commuters with drivers already making the
same daily trip — recurring, pre-scheduled, zero-detour carpools with **partner-level
TDM reporting**.

Pilot partner: **GoTriangle** (Research Triangle Park). See `docs/GOTRIANGLE-PITCH.md`.

**Origin story:** Built by a Cisco RTP intern who commutes from Chapel Hill without a car — CH Transit → GoTriangle → RTP Connect daily, while a direct drive is ~20 minutes.

## Features

### Commuter app
- **Recurring commute scheduling** — set origin, destination, arrival window, and days once
- **Matching engine** — pairs riders with drivers by day overlap, arrival-window overlap,
  destination proximity, and a zero-detour corridor check
- **Match proposals** — accept/decline; accepting auto-generates upcoming rides
- **Dashboard** — today's ride, next 7 days, Venmo pay link
- **Trust layer** — `.edu`/employer email verification, bios, emergency contact
- **Impact page** — ride history, money saved vs. Uber, CO₂ avoided

### Institutional layer (B2B2C)
- **Organizations & programs** — employers and transit agencies (`Organization`, `Program`)
- **Branded enrollment** — `/join/[slug]` (e.g. `/join/gotriangle`)
- **Partner TDM dashboard** — `/partner/[slug]` with enrollment, rides, miles, CO₂, SOV avoided
- **Program-linked signup** — commuters enrolled in partner org on registration

### Marketing
- `/for-transit` — transit agency / GoTriangle pitch page
- `/for-employers` — employer / intern program page

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

- `prisma/schema.prisma` — User, Organization, Program, OrganizationMember, CommuteSchedule, Match, Ride, Cluster, Message
- `src/lib/organizations.ts` — partner enrollment helpers
- `src/lib/partner-stats.ts` — TDM metrics for `/partner/[slug]`
- `src/lib/matching.ts` — matching engine and ride generation
- `src/lib/geo.ts` — haversine/corridor math, fare, Uber estimate, CO2 formulas
- `src/lib/actions.ts` — server actions (auth, onboarding, matches, rides, chat)
- `src/app/(app)/` — authenticated commuter app
- `src/app/for-transit/`, `for-employers/`, `join/[slug]/`, `partner/[slug]/` — B2B2C surfaces
- `docs/GOTRIANGLE-PITCH.md` — outreach plan for GoTriangle

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
