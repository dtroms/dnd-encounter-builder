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

- User-owned records.
- Supabase persistence.
- RLS policies.
- Deployment environment variables.
- Production-safe import attribution and validation.

The current auth shell is not enough for public beta data safety by itself. RLS
and persistence wiring still need to be completed before real user data is
stored.

No payments, subscriptions, or donations should be added before auth and data
isolation are stable.
