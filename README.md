# Job Journal — v1 (manual core, no AI)

A personal job-application tracker built as a case-file/ledger, not a generic dashboard.
You log every application yourself, update its stage as things happen, and the app
surfaces two things you can't easily see by eye: which applications have gone quiet,
and which skills keep showing up across everything you've applied to.

## Live

- **App:** https://jobjournal-ph.vercel.app
- **API:** https://job-journal-api.onrender.com

Note: the backend is on Render's free tier, which sleeps after inactivity. The first
request after idle time can take 20-30 seconds to respond while it wakes up — that's
expected, not a bug.

## Features

- **New entry** — log a company, role, the full posting text, and the skills you
  noticed while reading it
- **Open cases** — see every application, expand any row to re-read its full job
  description, update its stage via dropdown, or delete it
- **Standing** — a funnel of how many applications reached each stage, which skills
  show up most often across everything you've applied to, and which applications
  have had no stage change in the last 14 days

## How data flows, end to end

1. You fill out **New entry**: company, role, pasted JD, and skills you noticed,
   typed in as a comma-separated list.
2. `api.ts` sends `POST /applications` with all of that.
3. The backend inserts into `applications`, logs the first `stage_events` row
   ("applied"), and inserts each requirement into `job_requirements` with
   `source: "manual"`.
4. On **Open cases**, changing the stage dropdown fires `PATCH /applications/:id/stage`,
   which updates `applications.currentStage` and inserts a new `stage_events` row —
   history is never overwritten, only appended to. Deleting an application removes
   its `stage_events` and `job_requirements` rows first, then the application itself.
5. On **Standing**, `GET /dashboard` runs three SQL queries over your own stored
   data — funnel counts, top skills, stalled applications. No AI involved anywhere
   in v1.

## Setup

**Backend**
```bash
cd backend
cp .env.example .env
# edit .env with your own DATABASE_URL (a free Postgres instance - Neon, Railway, or Render all work)
npm install
npx drizzle-kit generate
npx drizzle-kit migrate
npm run dev          # http://localhost:4000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev           # http://localhost:5173
```

## Deployment

- **Database:** Neon (free tier, no expiry)
- **Backend:** Render (free tier, Node web service)
- **Frontend:** Vercel (free tier, Vite preset)

The frontend reads its backend URL from `VITE_API_URL` (falls back to
`http://localhost:4000` if unset, so local dev needs no configuration). The backend
reads its database connection from `DATABASE_URL`. Both are set as environment
variables on their respective platforms, separate from the local `.env` files used
for development.

## Reviewing how this was built

This repo has one commit per file/layer, oldest first:
```bash
git log --oneline --reverse
```

## What's NOT built (by design)

No auth, no email integration, no scraping, no AI. Stage changes and skill entry
are manual.
