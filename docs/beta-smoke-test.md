# Beta Smoke Test

Run this after deploying to Vercel and configuring Supabase Auth redirects.

## Auth

- [ ] Sign up with a test beta email.
- [ ] Confirm the email if Supabase requires confirmation.
- [ ] Sign in.
- [ ] Sign out.
- [ ] Sign back in.

## Dashboard

- [ ] Saved Encounters dashboard loads.
- [ ] Empty state is understandable for a new user.
- [ ] Create a new encounter shell.
- [ ] Duplicate an encounter.
- [ ] Archive an encounter.
- [ ] Search/filter/sort still work.

## Creature Library

- [ ] Creature Library loads.
- [ ] Empty state is understandable for a new user.
- [ ] Create a creature.
- [ ] Edit the creature.
- [ ] Duplicate the creature.
- [ ] Remove/delete/archive the creature according to current UI.
- [ ] Add a linked character sheet URL.
- [ ] View Sheet opens the embed panel or shows the new-tab fallback.

## Importer

- [ ] Importer loads.
- [ ] Paste a user-provided/custom stat block.
- [ ] Review parsed fields.
- [ ] Save to Library.
- [ ] Saved imported creature appears in the Creature Library.
- [ ] SRD import UI is hidden by default.

## Builder

- [ ] Builder loads.
- [ ] Create/open an encounter workflow still renders.
- [ ] Add creatures from the current library/session list.
- [ ] Create combat groups.
- [ ] Assign combatants to groups.
- [ ] Create wave tabs.
- [ ] Launch Runner.

## Runner

- [ ] Runner loads.
- [ ] Roll initiative.
- [ ] Edit initiative manually.
- [ ] Apply HP damage.
- [ ] Apply HP healing.
- [ ] Toggle standard conditions.
- [ ] Toggle spell effects.
- [ ] Add a custom spell effect.
- [ ] Use group Roll Init.
- [ ] Use group Shared Init.
- [ ] Confirm synthetic Lair Action row still appears when expected.
- [ ] Confirm linked sheet icon appears for linked combatants.

## Security

- [ ] Production/beta has `NEXT_PUBLIC_USE_DEMO_DATA=false`.
- [ ] Production/beta has `NEXT_PUBLIC_ENABLE_SRD_IMPORT=false`.
- [ ] No service role key is present in Vercel env vars.
- [ ] A second test user cannot see the first user's saved rows once that area
  is persisted.
- [ ] RLS smoke test has been run or manually verified before inviting beta
  users.

## Known Limitations

- SRD import is hidden/in progress.
- Payments, subscriptions, and donations are not implemented.
- No official non-SRD D&D monster data is bundled.
- Builder save/load may still be incomplete depending on the current persistence
  pass.
- Runner persistence is first-pass and action-based.
