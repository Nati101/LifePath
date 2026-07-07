# LifePath Web App

A career exploration assessment web app built with **Next.js** and **Supabase**, modeled after personality.co's one-question-at-a-time test experience.

## Features

- **Student flow**: Register → guided assessment (144 questions, 4 sections) → results dashboard
- **Admin flow**: View all students, completion rates, individual results
- **Scoring engine**: Ports the Excel assessment logic (Interests 35% + Strengths 35% + Drivers 20% + Work Style 10%)
- **Personality.co-style UX**: One question per screen, progress bar, section transitions, loading animation before results

## Quick Start

### 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. If saves fail or progress stays at 0%, also run `supabase/fix_rls.sql`
4. Create your first admin user via the Auth dashboard, then run:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in your Supabase URL and anon key.

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy under `example.com/test`

Set these environment variables:

```
NEXT_PUBLIC_BASE_PATH=/test
NEXT_PUBLIC_SITE_URL=https://example.com
```

Deploy to Vercel (recommended) or any Node host. Point your domain's `/test` path via:

- **Vercel**: set `basePath` in config (already wired) + add rewrite in your main site if needed
- **Reverse proxy** (nginx): `location /test { proxy_pass http://lifepath-app:3000; }`

## Project structure

```
web/
├── src/
│   ├── app/              # Next.js pages (login, assessment, results, admin)
│   ├── components/     # Quiz UI, results, progress bar
│   ├── data/           # assessment-data.json (exported from Excel)
│   └── lib/
│       ├── scoring.ts  # Scoring engine
│       └── supabase/     # Auth clients
├── supabase/
│   └── schema.sql      # Database schema
└── .env.example
```

## User roles

| Role | Access |
|------|--------|
| `student` | Take assessment, view own results |
| `admin` | View all students, completion stats, individual results |

## Assessment sections

1. **Interests** (36 items) — what you enjoy
2. **Strengths** (36 items) — what you can do
3. **Drivers** (36 items) — what motivates you
4. **Work Style & Environment** (36 items) — preferred conditions

Results unlock after all 144 questions are answered.
