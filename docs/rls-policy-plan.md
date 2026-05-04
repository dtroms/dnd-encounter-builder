# RLS Policy Plan

## Purpose

This plan explains the beta data isolation rules in plain English. The app still
uses local/session data today, but these policies prepare the database for user
owned persistence.

## Profile Access

Each signed-in user can:

- read their own profile
- create their own profile if the auth trigger has not already done it
- update their own profile

Users cannot read or update other users' profiles.

## Root User-Owned Tables

These tables are owned directly by `owner_user_id`:

- `creature_templates`
- `stat_block_imports`
- `encounters`

The rule is the same for each table:

- users can select rows where `owner_user_id = auth.uid()`
- users can insert rows only when `owner_user_id = auth.uid()`
- users can update rows they own
- users can delete rows they own

No broad anonymous read policy is included.

## Encounter Child Tables

These tables are protected through their parent encounter:

- `combat_groups`
- `encounter_combatants`
- `encounter_waves`
- `encounter_wave_members`
- `initiative_entries`
- `encounter_log`

A user can access child rows only when the parent encounter belongs to that user.
For `encounter_wave_members`, the policy checks the member's wave, then that
wave's parent encounter.

## Shared Content Decision

There is no public shared creature library policy yet.

For beta, creature libraries are private. Future SRD import should create
user-owned `creature_templates` unless the project later adds a separate reviewed
global SRD catalog with its own attribution and access rules.

## Local Demo Mode

Local Demo Mode is separate from signed-in persistence. Demo state should not be
treated as production user data, and sample data should not be relied on for
public beta users.

## RLS Test Checklist

Before public beta persistence:

- Create two test users.
- Confirm user A cannot select user B's profile.
- Confirm user A cannot select, update, or delete user B's creatures.
- Confirm user A cannot select, update, or delete user B's encounters.
- Confirm user A cannot access user B's combatants, combat groups, waves,
  initiative rows, or encounter log rows.
- Confirm user A can create root records only with user A's auth id as
  `owner_user_id`.
- Confirm anonymous users cannot read user-owned tables.
- Confirm service role keys are never exposed to browser code.
