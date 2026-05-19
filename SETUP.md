# amisuperhuman — Production Setup Guide

> RebelTechnologist · Superhuman Index Platform
> Stack: Next.js 14 · Supabase · Claude API · Resend · Vercel

---

## What's already done

- [x] Next.js 14 app scaffolded (App Router, TypeScript)
- [x] Supabase project created: `ulmkluljrtjqmfnsrcvd` (eu-west-1, Novosapien org)
- [x] Database schema migrated: `profiles`, `scores`, `monthly_reports` tables with RLS
- [x] Claude API integration with full Superhuman scoring system prompt
- [x] All 3 screens: Landing → Processing → Report
- [x] Share modal (Copy Link, LinkedIn, X/Twitter)
- [x] Email capture → Resend delivery + Supabase storage
- [x] Mobile-responsive

---

## Step 1 — Get your API keys (15 minutes)

### Anthropic (Claude API)
1. Go to https://console.anthropic.com/
2. Create an API key
3. Save as `ANTHROPIC_API_KEY`

### Supabase
1. Go to https://supabase.com/dashboard/project/ulmkluljrtjqmfnsrcvd/settings/api
2. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
   ⚠️ Never expose the service_role key in the browser

### Resend (email)
1. Go to https://resend.com/ and create a free account
2. Create an API key → `RESEND_API_KEY`
3. Add and verify your sending domain (amisuperhuman.com)
   - In Resend: Domains → Add Domain → follow DNS instructions
   - Until verified, Resend only sends to your own account email

---

## Step 2 — Local setup (5 minutes)

```bash
cd amisuperhuman
cp .env.local.example .env.local
# Fill in all values in .env.local

npm install
npm run dev
# → http://localhost:3000
```

---

## Step 3 — Create GitHub repo (5 minutes)

```bash
cd amisuperhuman

git init
git add .
git commit -m "feat: initial production build"

# Create repo at github.com/new — name it 'amisuperhuman', private
# Then:
git remote add origin https://github.com/YOUR_USERNAME/amisuperhuman.git
git branch -M main
git push -u origin main
```

---

## Step 4 — Deploy to Vercel (10 minutes)

1. Go to https://vercel.com/new
2. Import your `amisuperhuman` GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Add all environment variables from your `.env.local`:
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_APP_URL` = `https://amisuperhuman.com`
5. Deploy
6. Add custom domain: `amisuperhuman.com`

---

## Step 5 — Connect amisuperhuman.com domain

In your domain registrar (or Vercel DNS):
- Add A record: `@` → Vercel IP (shown in Vercel dashboard)
- Add CNAME: `www` → `cname.vercel-dns.com`

Vercel will auto-provision SSL.

---

## Database

**Supabase project:** https://supabase.com/dashboard/project/ulmkluljrtjqmfnsrcvd

Tables:
- `profiles` — one row per submission (LinkedIn URL, profile text, role, industry)
- `scores` — one row per grading (5 dimension scores, full analysis JSON)
- `monthly_reports` — populated manually or via Edge Function for the Superhuman Index

To view all submissions:
```sql
SELECT p.submitted_name, p.submitted_email, p.industry, s.superhuman_readiness_score, p.submitted_at
FROM profiles p
JOIN scores s ON s.profile_id = p.id
ORDER BY p.submitted_at DESC;
```

---

## Extending the platform

### PDF report generation
Install `@react-pdf/renderer` and create `app/api/pdf/route.ts`.
The `SuperhumanAnalysis` type has everything needed to populate the PDF.

### LinkedIn URL scraping (optional upgrade)
Install Proxycurl (`npm install proxycurl-js`) and add `PROXYCURL_API_KEY` to env.
Update `app/api/analyze/route.ts` to fetch profile data before calling Claude.

### Monthly Superhuman Index report
Create a Supabase Edge Function or cron job that aggregates `scores` by `role_category`
and inserts a summary row into `monthly_reports`.

---

## Architecture

```
User browser
    │
    ├── GET /              → Landing screen (form)
    │                           ↓ submit
    ├── POST /api/analyze  → lib/claude.ts → Claude API
    │                           ↓ analysis JSON
    ├── Report screen
    │                           ↓ email capture
    └── POST /api/send-report → Supabase (profiles + scores)
                                → Resend (email delivery)
```
