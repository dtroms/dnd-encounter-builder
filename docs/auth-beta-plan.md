# Auth Beta Plan

## Goal

Allow beta users to sign up, sign in, and use their own saved app data without
seeing or modifying anyone else's data.

## Current Foundation

The app now has a client-side Supabase Auth foundation:

- Email/password sign-up.
- Email/password sign-in.
- Sign-out from the top bar.
- Current session detection on app load.
- Auth state updates while the app is open.
- Local demo mode when Supabase env vars are missing.

This pass does not persist encounters, creatures, imports, campaigns, or runner
state to Supabase. Those areas still use local/session state.

## Provider

Use Supabase Auth for the beta auth provider.

## Required Flows

- Sign up.
- Sign in.
- Sign out.
- Password reset later.
- Protected app routes later.

## User-Owned Data

Future persisted records should be owned by a user:

- Saved encounters.
- Creature library templates.
- Imports.
- Campaigns.

Existing and planned `owner_user_id` fields should be used for ownership. A
`profiles` table may be useful for display names and beta metadata.

## Database Implications

Before a public beta with real user data:

- Confirm all user-owned tables have `owner_user_id`.
- Add or verify profiles support if needed.
- Add RLS policies before exposing persistent data.
- Test that users can only read and write their own records.
- Keep local/sample data separate from production user data.

## Environment Variables

Client auth uses only public browser-safe Supabase values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do not expose service role keys. If these vars are absent, the app runs in Local
Demo Mode and does not require sign-in.

## Next Steps

1. Add/verify a `profiles` table migration if profile metadata is needed.
2. Add RLS policies for user-owned tables.
3. Wire `owner_user_id` writes for new records.
4. Persist saved encounters.
5. Persist Creature Library templates.

## Beta Deployment Steps

- Push the repo to GitHub when ready.
- Create the Vercel project.
- Add Supabase URL and anon key to Vercel environment variables.
- Never expose service role keys in the browser or Vercel client env.
- Configure Supabase auth redirect URLs for local and Vercel domains.
- Run an RLS test checklist before inviting beta users.

## Boundaries

Do not add payments, subscriptions, or donations before auth and data isolation
are stable. Do not rely on sample data for production users.
