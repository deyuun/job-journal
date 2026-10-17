# JobJournal (v2: AI skill extraction)

A personal job-application tracker built as a case file, not a generic dashboard.
You log every application yourself and update its stage as things happen. The app
shows you two things that are hard to see by eye: which applications have gone
quiet, and which skills keep showing up across the postings you apply to.

## Live

- **App:** https://jobjournal-ph.vercel.app
- **API:** https://job-journal-api.onrender.com

The backend is on Render's free tier, which sleeps after inactivity. The first
request after idle time can take 20-30 seconds while it wakes up. Filing an
application is also a bit slower than before, because the backend waits on the AI.

## Features

- **New entry:** log a company, role, and the full posting text. The skills are
  extracted from the posting automatically.
- **Open cases:** see every application, expand a row to re-read its posting,
  change its stage with a dropdown, or delete it.
- **Standing:** three views of your search
  - *Right now*: how many applications currently sit at each stage
  - *Where applications have been*: how many ever reached each stage
  - *What keeps getting asked for*: the skills that appear most across your postings
  - *Gone quiet*: applications with no stage change in 14 days

## How AI extraction works

1. You paste a posting into **New entry** and file it.
2. The backend saves the application and its first stage event.
3. `services/llmExtract.ts` sends the posting to Groq (`openai/gpt-oss-20b`) and
   asks for the requirements as JSON.
4. The reply is parsed and checked with Zod before anything is trusted.
5. Each skill is saved to `job_requirements` with `source: "ai"`.

This is the only place the app uses AI. The dashboard is plain SQL counting
stored rows, so it works the same whether a skill was typed or extracted.

**If extraction fails** (rate limit, Groq outage, unparseable reply), the
application still saves. It just has no skills, and the error is logged with
Groq's response body.

**Known limits**
- Extraction runs once, when the application is created. There is no retry.
- Skill names are not normalized, so "REST" and "REST APIs" count separately.
- Extracted skills can't be edited from the UI.
- Applications filed before v2 keep their manually typed skills (`source: "manual"`).
- Groq retires models over time. The original model was retired in Aug 2026.

## How data flows

1. `AddApplication.tsx` calls `createApplication()` in `api.ts`, which sends
   `POST /applications` with company, role, and posting text.
2. The backend inserts into `applications`, adds the first `stage_events` row
   ("applied"), then runs the AI extraction.
3. Changing a stage fires `PATCH /applications/:id/stage`. It updates
   `applications.current_stage` and adds a `stage_events` row. History is only
   ever appended to, never overwritten.
4. Deleting an application removes its `stage_events` and `job_requirements`
   rows first, then the application itself.
5. `GET /dashboard` runs SQL queries over your stored data for the Standing page.

## Setup

**Backend**
```bash
cd backend
cp .env.example .env
# fill in DATABASE_URL (any Postgres) and GROQ_API_KEY (free at console.groq.com)
npm install
npx drizzle-kit generate
npx drizzle-kit migrate
npm run dev          # http://localhost:4000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

## Deployment

- **Database:** Neon (free tier, no expiry)
- **Backend:** Render (free tier, Node web service)
- **Frontend:** Vercel (Vite preset)

The frontend reads its API address from `VITE_API_URL` and falls back to
`http://localhost:4000`, so local development needs no setup. The backend reads
`DATABASE_URL` and `GROQ_API_KEY`. On each platform these are set in the
dashboard, separate from the local `.env` files.

## Reviewing how this was built

The repo has one small commit per step, oldest first:
```bash
git log --oneline --reverse
```

## Not built

No auth, no email integration, no scraping. Stage changes are manual.