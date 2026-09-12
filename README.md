# VoltScout

**Autonomous Discovery Agent & Career Portal for Electrical Engineering internships, research fellowships, and corporate co-ops.**

VoltScout combines a scheduled/manual scouting agent, a multi-axis opportunity catalog, an AI resume-fit matcher, a cover-letter studio, a Kanban application tracker, and a hiring-intelligence analytics dashboard into one full-stack app.

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Prisma** ORM over **Postgres**
- **Tailwind CSS** for styling, **Recharts** for analytics, **@dnd-kit** for the Kanban board
- **Gemini API** (`@google/generative-ai`) with **Google Search grounding** for the live scouting agent, resume matcher, and cover-letter generator — with deterministic fallbacks so every feature works with zero configuration

## Getting Started

```bash
npm install
cp .env.example .env      # then set DATABASE_URL to your Postgres connection string
npx prisma db push        # creates the schema in your database
npm run db:seed           # seeds 15 real-world EE opportunities
npm run dev                # http://localhost:3000
```

Need a free Postgres instance? [Neon](https://neon.tech) and [Supabase](https://supabase.com) both offer one; Vercel also lets you provision a Neon database directly from a project's Storage tab.

## Deploying to Vercel

1. Push this repo to GitHub, then [sign up at vercel.com](https://vercel.com/signup) (free, no card required) and **Add New Project** → import the repo.
2. In the project's **Storage** tab, click **Create Database** → **Neon** (Postgres) and connect it — this automatically sets the `DATABASE_URL` env var for you.
3. Deploy. The `build` script runs `prisma generate` automatically; after the first deploy, run `npx prisma db push` locally with that same `DATABASE_URL` (or via `vercel env pull` + `npx prisma db push`) to create the tables, then `npm run db:seed` to seed data.
4. Optionally add `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` in **Settings → Environment Variables** to enable live AI features (the app works without them via deterministic fallbacks).

To build for production:

```bash
npm run build
npm start
```

### Enabling live AI (optional)

Without any configuration, VoltScout runs entirely on high-quality deterministic fallbacks:
- The scouting agent "discovers" new roles from a curated internal pool of real postings.
- The resume matcher scores fit via keyword/skill overlap heuristics.
- The cover-letter studio uses templated, tone-aware generation.

VoltScout supports two interchangeable live-AI providers — pick whichever you have a key for:

| Provider | Env var | Get a key | Search grounding |
|---|---|---|---|
| **Anthropic (Claude)** | `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys | Claude's server-side web search tool |
| **Google (Gemini)** | `GEMINI_API_KEY` | https://aistudio.google.com/apikey | Google Search grounding |

Set one (or both) in `.env` and restart the server. **If both are set, Anthropic is used by default** — set `AI_PROVIDER=gemini` to force Gemini instead. The Scout Agent page will show the active provider (e.g. `Claude + web search`) on new runs; if a live call ever fails, everything automatically falls back to simulated/heuristic mode so the app never breaks. `ANTHROPIC_MODEL` optionally overrides the default model (`claude-opus-5`) if you want a cheaper/faster one.

## Feature Tour

### 1. Autonomous Scouting Agent (`/scout`)
- Runs automatically every day at **08:00 UTC** (self-rescheduling timer wired up in `src/instrumentation.ts` — no external cron service needed).
- Manual **Targeted Scout Dispatch**: pick specific EE sub-disciplines (VLSI, Power Electronics, Embedded Systems, RF/Telecom, etc.) and fire an on-demand scan.
- **Execution Terminal**: live-styled log of dispatched queries, verified citations, run duration, and newly indexed roles, plus run history.

### 2. Opportunity Catalog (`/`)
- One-click quick filters ("Power Electronics Internship", "Digital or Analog Intern", etc.)
- Multi-dropdown filters: Sector, Region, Education Level, Season/Cohort, plus a Visa Sponsorship checkbox and an EE Discipline filter.
- Fuzzy/boolean search — try `power electronics`, `cern fpga`, or `digital or analog`.
- **Role Detail Inspector** modal: full responsibilities/qualifications, EDA tools & frameworks, stipend/housing info, official portal link, private notes editor, and a pipeline-stage changer.

### 3. AI Candidate Fit & Pitch Studio (`/studio`)
- **Resume Fit Matcher**: paste a profile (or one-click load a sample EE student profile) to get an overall fit score, core strengths, growth areas, and top-matching openings.
- **Cover Letter & Outreach Generator**: pick a target role + tone (Corporate Tech / Academic Rigor / Cutting-Edge) to generate a tailored letter, subject line, and interview talking points — with one-click copy.

### 4. Application Pipeline (`/pipeline`)
- 4-stage Kanban: Saved & Wishlist → Applied/Submitted → Technical Interview → Offer Received.
- Drag-and-drop between stages (or use the stage dropdown in the Role Detail modal), private notes, quick stats.

### 5. Hiring Intelligence & Analytics (`/analytics`)
- Hiring share by EE sub-field, sector ratio (industry/corporate vs. academia/national labs), geographic distribution, and international visa-friendliness ratio.

## Data Model

See `prisma/schema.prisma`. Categorical fields (`orgType`, `region`, `season`, `level`, `userStatus`) are stored as validated strings rather than native enums — canonical value sets live in `src/lib/constants.ts` and are enforced at the API boundary in `src/lib/validation.ts`.

## Project Structure

```
src/
  app/                 Next.js routes (pages + API handlers)
  components/          UI, grouped by feature module
  lib/
    constants.ts        Shared vocabulary (domains, filters, tones, etc.)
    opportunity-data.ts Seed data + simulated-scouting discovery pool
    scout.ts             Core scouting agent (used by API + scheduler)
    ai.ts                 Provider orchestrator (Anthropic vs Gemini vs heuristic)
    anthropic.ts          Live Claude + web search tool calls
    gemini.ts             Live Gemini + Google Search grounding calls
    heuristics.ts         Deterministic fallback intelligence
    search.ts            Fuzzy/boolean catalog search
  instrumentation.ts    Boots the daily 08:00 UTC autonomous scout run
prisma/
  schema.prisma
  seed.ts               Seeds 15 real-world EE opportunities
```
