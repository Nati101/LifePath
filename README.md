# LifePath

Career exploration assessment for students ages 14–18. Students take a guided 144-question assessment and receive personalized career path results; admins can monitor progress and review outcomes.

## Repository layout

| Path | Description |
|------|-------------|
| `web/` | Next.js app (Supabase auth, assessment flow, results, admin dashboard) |
| `LifePath_ASSESSMENT_NEW.xlsx` | Source assessment workbook |

## Quick start

See [`web/README.md`](web/README.md) for setup (Supabase, environment variables, and local dev).

```bash
cd web
cp .env.example .env.local   # add your Supabase URL and anon key
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- **Frontend:** Next.js 16, React, Tailwind CSS v4
- **Backend:** Supabase (Auth, Postgres, RLS)
- **Hosting:** GitHub Pages (static export) or Vercel (full server features)

## GitHub Pages

See [`web/README.md`](web/README.md#deploy-to-github-pages) for Supabase redirect URLs and GitHub Actions secrets.
