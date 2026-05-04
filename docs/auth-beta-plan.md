# Auth Beta Plan

## Goal

Allow beta users to sign up, sign in, and use their own saved app data without
seeing or modifying anyone else's data.

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
