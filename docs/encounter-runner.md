# Encounter Runner

The Encounter Runner is the live table view for initiative, HP, AC, conditions,
combat groups, waves, lair actions, and selected combatant details.

In signed-in Supabase mode, the Runner now has first-pass live-state
persistence. Opening a saved encounter in the Runner loads encounter metadata,
combatants, combat groups, initiative entries, and waves from Supabase. Local
Demo Mode keeps the existing local/session behavior and makes no database calls.

## Supabase Runner Persistence

The Runner uses action-based saves rather than background sync. The UI updates
immediately, then the app saves the changed row through Supabase and RLS.

The first pass persists:

- current round and turn index on `encounters`
- active initiative entry and selected initiative entry when available
- combatant HP
- combatant display name overrides
- combatant initiative values and manual initiative flags
- standard conditions on `encounter_combatants.conditions`
- combat group creation, rename, recolor, clear, remove, and assignment
- wave deployment state on `encounter_waves.deployed` and `deployed_at`
- synthetic Lair Action row display name and initiative overrides

If the selected saved encounter has no combatants yet, the Runner shows the
normal empty combat state. If no saved encounter is selected in signed-in mode,
the Runner asks the user to open an encounter from the dashboard or Builder.

## Initiative Entries and Lair Actions

Normal combatant rows are mirrored through `initiative_entries` when present.
On Runner load, the app creates missing combatant initiative rows and one missing
synthetic Lair Action row when safe. This prevents duplicate Lair Action rows
while allowing a saved combat to resume.

Synthetic Lair Action rows remain separate from their source monster:

- row name saves to `initiative_entries.display_name`
- row initiative saves to `initiative_entries.initiative_value`
- source monster name and initiative are not overwritten

`active_entry_id` and `selected_entry_id` are separate. Advancing the turn saves
the active entry; clicking a row for inspection saves the selected entry without
changing the active turn.

## Conditions and Spell Effects

The left-side Conditions card is organized around the selected combatant:

- Selected combatant summary.
- Standard conditions such as blinded, prone, restrained, hidden, and
  concentrating.
- Spell Effects for common spell-based reminders.

Standard conditions and spell effects are intentionally separate. Spell effects
are stored on the local combatant as `spellEffects`, separate from the existing
`conditions` list.

Current spell effect toggles include:

- Bless
- Bane
- Hunter's Mark
- Faerie Fire
- Hex
- Shield of Faith
- Haste
- Slow
- Guiding Bolt
- Sanctuary
- Protection

`Concentrating` remains in the standard condition list for now so existing
condition behavior is not disrupted.

Active spell effects can appear as compact chips in the initiative row and in
the selected combatant detail panel. The row display stays intentionally small:
it shows the first one or two effects, then a compact additional count.

Spell effect buttons use the same compact button treatment as standard
conditions. Users can also type a custom spell or effect name into the custom
effect input and press Enter or the plus button to add it to the selected
combatant. Empty custom effects are ignored, and exact duplicates are blocked
for that combatant. Custom effects are local/session-only and can be removed by
clicking their active chip.

The current database schema does not have a dedicated `spell_effects` column.
For this pass, spell effects are preserved in
`encounter_combatants.snapshot_metadata.spellEffects` so they remain separate
from standard conditions. A later migration can promote them to a dedicated
column or child table if the model needs richer duration/concentration tracking.

## Combat Groups

Combat groups are encounter-level shared state. The Builder and Runner both read
and update the same group list for the current encounter. In signed-in Runner
mode, group changes save to `combat_groups`, and combatant assignments save to
`encounter_combatants.combat_group_id`.

Combatants are assigned with `combatGroupId`. Group labels and colors are kept
on combatants only as local display fallbacks, while the current group name and
row color are resolved from the shared group id where possible.

This means:

- Creating a group in Builder makes it available in Runner.
- Renaming or recoloring a group in Runner updates Builder.
- Assigning a combatant to a group in either view updates the other view.
- Clear unassigns combatants from the group while keeping the group available.
- Remove deletes the group and safely moves assigned combatants to Ungrouped.

Combat groups are separate from waves. A combatant can be in a reinforcement
wave and still belong to any encounter-level combat group. Ungrouped is
represented by no group assignment; counts are derived from combatant
assignments.

## Not Wired Yet

This pass intentionally does not include:

- full Builder save/load persistence
- Runner add/remove combatant persistence
- custom initiative rows beyond Lair Actions
- combat log persistence
- External scraping or fetching.
