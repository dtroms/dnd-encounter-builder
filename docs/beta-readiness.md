# Beta Readiness

## Current Beta Scope

The visible beta app should focus on stable local workflows:

- Saved Encounters dashboard navigation.
- Encounter Builder.
- Encounter Runner.
- Creature Library.
- Paste Stat Block importer.

The app now has a Supabase Auth shell for beta sign-in/sign-up/sign-out when
Supabase public env vars are configured. When those env vars are missing, it
continues to run in Local Demo Mode so local development is not blocked.

The database foundation now includes a `profiles` table and RLS policies for the
planned user-owned tables. This is a security preparation step only; the app
screens still use local/session state until persistence is wired deliberately.

The SRD monster import workflow remains in the codebase for behind-the-scenes
development, but it is hidden from normal beta UI until validation is reliable.
Local developers can set `NEXT_PUBLIC_ENABLE_SRD_IMPORT=true` to show the
in-progress SRD import tools.

## Importer Position

Beta users can paste stat blocks they have the right to use, review parsed
fields, and save creatures into local/session state. The SRD import plan,
Tabyltop CC-SRD adapter, and docs remain available for future work.

## Not Ready For Public Data Yet

Before storing real beta user data, the app still needs:

- Supabase persistence.
- RLS smoke tests and two-user validation.
- Owner user id writes from the app.
- Deployment environment variables.
- Production-safe import attribution and validation.

The auth shell plus RLS migration is still not enough for public beta data safety
by itself. Persistence wiring, owner assignment, and RLS tests still need to be
completed before real user data is stored.

No payments, subscriptions, or donations should be added before auth and data
isolation are stable.

## Current Data Isolation Plan

- Profiles are private to the signed-in user.
- Creature templates, stat block imports, and encounters are owned through
  `owner_user_id`.
- Encounter combatants, combat groups, waves, initiative rows, and encounter log
  rows are protected through parent encounter ownership.
- SRD imports should create private user-owned library records later unless a
  separate shared SRD catalog is designed.
- Local Demo Mode remains a local/session experience and is not production user
  storage.

## Persistence Progress

Saved Encounters metadata persistence has started for signed-in users:

- the dashboard can fetch the current user's `encounters`
- the dashboard can create a draft encounter shell
- the dashboard can duplicate encounter metadata
- the dashboard can archive an encounter row
- local demo/mock behavior remains available when Supabase is not configured or
  `NEXT_PUBLIC_USE_DEMO_DATA=true`

Builder, Runner, Creature Library, and Importer data are still local/session
state. Opening a database-backed encounter into Builder/Runner and wiring child
tables is the next persistence step.

## RLS Validation Gate

RLS validation must pass before wiring app data persistence.

The repeatable local smoke test lives at:

```text
supabase/tests/rls_smoke_test.sql
```

It checks that one fake beta user cannot see or modify another fake beta user's
profiles, creatures, imports, encounters, combat groups, combatants, waves,
initiative entries, or encounter log rows.

See `docs/rls-validation.md` for the plain-English checklist and local commands.

The browser/client app must never receive a Supabase service role key. Client
code should use only the public anon key and let RLS enforce user isolation.
