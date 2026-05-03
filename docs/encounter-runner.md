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

## Not Wired Yet

This runner behavior is intentionally local/session-only. It does not include:

- Supabase persistence.
- Auth or RLS.
- Remote database reads or writes.
- External scraping or fetching.
