# Vercel + Supabase Beta Deploy

This is the non-coder checklist for preparing the D&D Encounter Builder beta
deployment. Do not deploy until lint/build pass and RLS has been validated.

## Supabase Setup

Use the fresh D&D Encounter Builder Supabase project.

In the app, only these public values are allowed:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon public key

Never use these in Vercel client env vars:

- service role key
- database password
- JWT secret
- private API keys

## Auth Redirect URLs

After the Vercel project URL exists, configure Supabase Auth redirects.

Include local development:

```text
http://localhost:3000
```

Then add the Vercel URLs:

```text
https://your-project.vercel.app
https://your-production-domain.example
```

If you use Vercel preview deployments for beta testing, add the preview URL
pattern or the specific preview URLs supported by the Supabase project settings.

## Vercel Environment Variables

In Vercel Project Settings, add:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_USE_DEMO_DATA=false
NEXT_PUBLIC_ENABLE_SRD_IMPORT=false
```

Use `NEXT_PUBLIC_USE_DEMO_DATA=true` only for an intentional demo deployment.
Use `NEXT_PUBLIC_ENABLE_SRD_IMPORT=true` only for private importer testing.

## Before Deploying

Run locally:

```bash
npm run lint
npm run build
```

If Docker Desktop/local Supabase is available:

```bash
npx supabase db reset
npx supabase db diff --local
```

Run or review:

```text
supabase/tests/rls_smoke_test.sql
docs/rls-validation.md
```

## Deploy Flow

1. Go to Vercel.
2. Choose Add New Project.
3. Import the GitHub repo.
4. Confirm the framework is Next.js.
5. Add the Vercel env vars above.
6. Do not add the Supabase service role key.
7. Deploy.
8. Copy the Vercel deployment URL.
9. Add the Vercel URL to Supabase Auth redirect URLs.
10. Smoke test sign-up/sign-in/sign-out.
11. Confirm dashboard, builder, runner, library, and importer render.
12. Confirm no sample data appears in signed-in beta unless demo mode is enabled.
13. Confirm SRD import UI is hidden unless the flag is enabled.

The Supabase dashboard path may be named:

```text
Authentication -> URL Configuration
```

or similar, depending on the Supabase UI version.

## Beta Smoke Test

- Sign up with a test beta account.
- Sign out and sign back in.
- Create a saved encounter shell.
- Create a creature in the Library.
- Paste/import a custom stat block and save it to Library.
- Open Runner for a saved encounter and verify live state does not crash.
- Confirm another test user cannot see the first user's rows.

## Known Limits For First Beta

- SRD import UI is hidden until validation is stable.
- Builder save/load is still being completed.
- Runner live-state persistence is first-pass and action-based.
- Spell effects currently persist in combatant snapshot metadata.
- No payments, subscriptions, or donations are implemented.
- No official non-SRD monster data is bundled.
