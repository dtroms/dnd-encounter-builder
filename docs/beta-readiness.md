# Beta Readiness

## Current Beta Scope

The visible beta app should focus on stable local workflows:

- Saved Encounters dashboard navigation.
- Encounter Builder.
- Encounter Runner.
- Creature Library.
- Paste Stat Block importer.

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

- Sign up and sign in.
- User-owned records.
- Supabase persistence.
- RLS policies.
- Deployment environment variables.
- Production-safe import attribution and validation.

No payments, subscriptions, or donations should be added before auth and data
isolation are stable.
