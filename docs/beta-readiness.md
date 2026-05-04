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
- RLS testing with multiple users.
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
