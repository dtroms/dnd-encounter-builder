# Encounter Runner

The Encounter Runner is the live table view for initiative, HP, AC, conditions,
combat groups, waves, lair actions, and selected combatant details. It currently
uses local/session state only and does not read from or write to Supabase.

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

Future database persistence should keep standard conditions and spell effects as
separate fields or records. Future custom spell effects can build on the current
local `spellEffects` structure.

## Combat Groups

Combat groups are encounter-level shared state. The Builder and Runner both read
and update the same local group list for the current encounter.

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

This runner behavior is intentionally local/session-only. It does not include:

- Supabase persistence.
- Auth or RLS.
- Remote database reads or writes.
- External scraping or fetching.
