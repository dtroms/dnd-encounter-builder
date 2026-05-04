# RLS Validation

## What RLS Means

RLS means Row Level Security. It is a database safety layer that decides which
rows a signed-in user can see or change.

For beta users, this matters because two different Dungeon Masters should not be
able to see each other's saved encounters, creature libraries, imports, combat
groups, initiative rows, or profile details.

RLS is separate from the app UI. Even if a bug appears in the browser, the
database should still reject rows that do not belong to the signed-in user.

## Before Public Beta

Before public beta with real saved data:

- local migrations must apply cleanly
- RLS smoke tests must pass
- two-user manual tests should be run
- client code must never expose a service role key
- app writes must set `owner_user_id` for root user-owned records
- child encounter rows must always belong to an encounter owned by the user

The app is not ready to store real beta user data until these checks pass.

## Protected Tables

| Table | Ownership rule | Expected access |
| --- | --- | --- |
| `profiles` | `id = auth.uid()` | User can see and update only their own profile. |
| `creature_templates` | `owner_user_id = auth.uid()` | User can create, read, update, and delete only their own creatures. |
| `stat_block_imports` | `owner_user_id = auth.uid()` | User can create, read, update, and delete only their own import records. |
| `encounters` | `owner_user_id = auth.uid()` | User can create, read, update, and delete only their own encounters. |
| `combat_groups` | Parent `encounters.owner_user_id = auth.uid()` | User can access groups only inside their own encounters. |
| `encounter_combatants` | Parent `encounters.owner_user_id = auth.uid()` | User can access combatants only inside their own encounters. |
| `encounter_waves` | Parent `encounters.owner_user_id = auth.uid()` | User can access waves only inside their own encounters. |
| `encounter_wave_members` | Wave parent encounter belongs to user | User can access wave members only when the wave belongs to their own encounter. |
| `initiative_entries` | Parent `encounters.owner_user_id = auth.uid()` | User can access initiative rows only inside their own encounters. |
| `encounter_log` | Parent `encounters.owner_user_id = auth.uid()` | User can access log rows only inside their own encounters. |

## Local Smoke Test

The local SQL smoke test is:

```text
supabase/tests/rls_smoke_test.sql
```

It uses fake local users:

- User A: `rls-user-a@example.test`
- User B: `rls-user-b@example.test`

The test seeds rows for both users, then simulates User A by using the
`authenticated` role and setting the same JWT claim that Supabase Auth normally
sets. The script fails if User A can see, update, delete, or insert data that
belongs to User B.

The script covers:

- profiles
- creature templates
- stat block imports
- encounters
- combat groups
- encounter combatants
- encounter waves
- encounter wave members
- initiative entries
- encounter log rows

It cleans up its fake rows at the beginning and end.

## Local Commands

Start Docker Desktop first, then run:

```powershell
npx supabase db reset
```

Then run the smoke test against the local database:

```powershell
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/tests/rls_smoke_test.sql
```

If `psql` is not available in your terminal, open local Supabase Studio after
`db reset`, go to the SQL Editor, and run the contents of:

```text
supabase/tests/rls_smoke_test.sql
```

Then check for schema drift:

```powershell
npx supabase db diff --local
```

Do not run these commands against a remote production database.

## Expected Result

The SQL script should finish with:

```text
RLS smoke test passed
```

If a policy is too loose, the script raises an error like:

```text
User A updated User B creature
```

If a policy or grant is too restrictive, the script fails when User A attempts a
valid action on User A's own rows.

## What This Does Not Test Yet

This does not wire the app UI to Supabase. It does not test real saved encounter
flows from the browser. It is a database-level safety test that should pass
before persistence work begins.
