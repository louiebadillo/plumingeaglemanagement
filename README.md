# PEL Client Management Software

Web application for **Pluming Eagle Lodge (PEL)** to manage group-home facilities, clients, staff, and shared daily reports. Built with React, Material UI, and Supabase.

Production site: [pelreports.ca](https://pelreports.ca)

---

## What this app does

PEL Client Management helps on-site staff complete **one daily report per client per operational day** (6:00 AM–6:00 AM), while administrators oversee all facilities, clients, submissions, and analytics from one place.

### Administrators

- **Dashboard** — Monitor draft reports that need attention (after the morning cutoff).
- **Facilities** — Create and edit sites, assign clients, configure **geofencing** (address, latitude/longitude, map pin, radius).
- **Client masterlist** — Search and manage all clients across facilities.
- **Staff management** — Manage user accounts and roles.
- **Daily reports** — View in-progress and submitted reports organization-wide.
- **Progress analytics** — Charts and printable progress reports.
- **Location requests** — Review location-help reports sent from facility laptops (badge shows open count).

### Employees (on-site staff)

- **Dashboard** — See **today’s clients** for the facility they are physically inside (via browser geolocation + geofence).
- **Daily reports** — Create and edit the shared daily questionnaire (morning / afternoon / evening sections, file uploads for appointments, BIR, AWOL, injuries).
- **My reports** — Resume draft reports for the current operational day while on-site.
- **Location help** — Check GPS/geofence status, distance to each facility, copy or **send a location report to admins**, and follow steps to enable location in Chrome and Windows.

Employees only see clients when the device is detected **inside a facility geofence**. There is no manual facility picker for staff on the dashboard.

---

## Key concepts

### Operational day (6 AM cutoff)

The “reporting day” runs from **6:00 AM to 6:00 AM**. Before 6 AM, the app still treats reports as belonging to the previous operational date. Report locking and draft badges follow this schedule.

### Geofencing

Each facility can have a center point (lat/lng) and radius (meters). When an employee opens the app on-site:

1. The browser provides a location (Wi‑Fi / GPS).
2. The app checks which facility circle contains that point.
3. If matched, that facility’s **active** clients load on the dashboard.

Facility laptops often report inaccurate positions. Admins can tune geofences using **address geocoding**, **manual coordinates**, or **dragging the map pin** in Facility Management. Employees can use **Location help** when clients do not appear.

### Roles

| Role | Access |
|------|--------|
| **admin** | Full access: facilities, all clients, staff, all reports, analytics, location requests |
| **employee** | Dashboard (geofenced), daily reports, my reports, location help |
| **super_admin** | Same as admin (used in staff management / RLS where applicable) |

---

## Tech stack

- **React 18** (Create React App + `react-app-rewired`)
- **Material UI (MUI) v5**
- **Supabase** — Auth, PostgreSQL database, row-level security, storage
- **TanStack React Query** — Server state / caching
- **Google Maps** — Optional map for geofence setup (`REACT_APP_GOOGLE_MAPS_API_KEY`)

---

## Getting started

### Prerequisites

- Node.js 16+ (LTS recommended)
- npm or yarn
- A Supabase project with the app schema and RLS policies configured

### Install and run

```bash
git clone <repository-url>
cd plumingeaglemanagement
npm install
cp env.example .env   # then fill in Supabase and other values
npm start
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create a `.env` file in the project root (see `env.example` for a starting point). Required for the app to run:

| Variable | Purpose |
|----------|---------|
| `REACT_APP_SUPABASE_URL` | Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `REACT_APP_GOOGLE_MAPS_API_KEY` | Optional — geofence map in Facility Management |

Common optional variables:

| Variable | Purpose |
|----------|---------|
| `REACT_APP_SITE_URL` | Canonical site URL (defaults to production host) |
| `REACT_APP_COMPANY_NAME` | Branding |
| `REACT_APP_COMPANY_TAGLINE` | Login / header tagline |
| `PUBLIC_URL` | Set to `/` for production builds (see `.env.production`) |

Default dev login values may be defined in `src/config.js` / `env.example` for local testing only — use real Supabase users in production.

### Supabase migrations

Run SQL migrations in the Supabase SQL editor when deploying new features, for example:

- `supabase/migrations/20250518_location_help_requests.sql` — Employee **Send to admin** / admin **Location requests** inbox

Ensure `users`, `facilities`, `clients`, `daily_reports_v2`, and related RLS policies exist for your environment.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Development server |
| `npm run build` | Production build (output in `build/`) |
| `npm test` | Run tests |
| `npm run format` | Format `src/` with Prettier |

---

## Project structure (high level)

```
src/
  pages/
    dashboard/          # Admin + employee home
    facility/           # Facility list, edit, per-facility clients
    client/             # Client profiles, masterlist, files
    reports/            # Daily reports, my reports, admin reports, progress
    location/           # Location help (employees), location requests (admins)
    staff/              # Staff management
  components/           # Shared UI (layout, sidebar, modals, maps)
  context/              # Supabase auth and app context
  hooks/                # Draft counts, location request counts, dialogs
  services/             # Location help requests API helpers
  utils/                # Geofencing, dates, uploads, session drafts
supabase/migrations/    # SQL to run in Supabase
```

---

## On-site troubleshooting (employees)

1. Open **Location help** in the sidebar.
2. Tap **Refresh location** and allow Chrome location for this site.
3. Confirm **Location access** shows permission allowed and **Position received: Yes**.
4. Check distances to each facility in the table.
5. If still wrong, use **Send to admin** so an administrator can adjust the geofence.

Developers can also run in the browser console (on-site):

```javascript
await window.pemDebug.run()
```

---

## Deployment

1. Set production environment variables (Supabase, maps key, `PUBLIC_URL=/`).
2. `npm run build`
3. Deploy the `build/` folder to your static host (e.g. Vercel, Netlify, or your server).
4. Configure Supabase auth redirect URLs for your production domain.

---

## License

See [LICENSE.txt](LICENSE.txt).
