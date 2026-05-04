# D&D Encounter Builder

A table-friendly web app for building encounters, managing a creature library,
and running initiative with HP, AC, conditions, combat groups, waves, and live
combat state.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run lint
npm run build
```

## Environment Setup

Copy `.env.example` to `.env.local` for local development.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_USE_DEMO_DATA=false
NEXT_PUBLIC_ENABLE_SRD_IMPORT=false
```

Only public browser-safe Supabase values belong in this app:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Never put a Supabase service role key, database password, JWT secret, or private
API key in `.env.local`, Vercel client env vars, or source control.

## Demo Mode

If Supabase env vars are missing, the app runs in Local Demo Mode so development
can continue with local sample data.

For production or beta deployments with Supabase configured, keep:

```bash
NEXT_PUBLIC_USE_DEMO_DATA=false
```

Set it to `true` only when intentionally showing local demo/sample data.

## Supabase Beta Setup

The app uses Supabase Auth and user-owned tables protected by RLS. The current
persistence work covers saved encounter metadata, creature library records,
imported pasted creatures, and first-pass Runner live state.

Before inviting beta users:

- apply migrations to the fresh D&D Encounter Builder Supabase project
- verify RLS with the local validation checklist
- configure Supabase Auth redirect URLs for local and Vercel
- add only public anon env vars to Vercel

See:

- `docs/auth-beta-plan.md`
- `docs/rls-validation.md`
- `docs/vercel-supabase-beta-deploy.md`
- `docs/beta-readiness.md`

## Content Boundary

This repo must not bundle official copyrighted non-SRD D&D monster data.

User imports are user-provided content. The SRD importer code and docs remain in
the repo, but the SRD import UI is hidden by default behind:

```bash
NEXT_PUBLIC_ENABLE_SRD_IMPORT=false
```

Set it to `true` only for local development/testing of the experimental
Tabyltop CC-SRD workflow.
