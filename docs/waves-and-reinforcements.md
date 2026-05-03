# Waves and Reinforcements

Waves let the DM prepare combatants in the Builder and deploy them later during
the Runner. This is useful for reinforcements, second phases, ambushes, delayed
summons, or enemies that enter after a trigger.

This feature is local-only for now. It does not persist to Supabase yet.

## Builder Setup

In the Builder, wave setup lives inside the Encounter Roster as tabs. The
separate Waves / Reinforcements card is no longer the primary workflow.

The roster tabs support:

- Wave 1 as the default starting encounter
- `+` to create Wave 2, Wave 3, and later waves
- switching between waves by clicking a tab
- adding new browser creatures directly to the active wave
- renaming a wave from its three-dot menu
- deleting a wave from its three-dot menu when more than one wave exists

The active wave tab determines where newly added creatures go. For example, if
Wave 2 is selected, Add and Add Multiple create Wave 2 combatants.

Deleting a wave asks for confirmation. The only remaining wave cannot be
deleted. Confirmed deletion moves that wave's combatants to the first remaining
wave, so combatants are not silently deleted.

Combat groups remain separate from waves. A combatant can belong to Wave 2 and
also be part of Red Warband, Gold Vanguard, or another combat group.

## Runner Deployment

The Runner shows a compact Waves / Reinforcements panel above the initiative
list when waves exist.

Each undeployed wave shows:

- wave name
- description, if present
- count of held combatants
- Deploy button

Wave 1 is deployed by default and represents the starting encounter. Later waves
are available for Runner deployment. Deploying a wave marks it as deployed and
makes its assigned combatants appear in the live initiative tracker.

## Initiative Behavior

When a wave is deployed:

- eligible non-PC combatants in that wave receive initiative if they do not
  already have one
- PCs are not auto-rolled by default
- manual initiative values are preserved
- combat groups and colors are preserved

After deployment, normal Runner controls still apply: group Roll Init, Shared
Init, manual initiative editing, sorting, HP controls, conditions, lair actions,
and stat block selection.

If a deployed wave includes a creature with lair actions, the synthetic Lair
Actions row can appear because the deployed creature is now part of the live
initiative set.

## Future Database Notes

Future database work should persist waves separately from combatants, likely
using encounter wave records and wave-member relationships. The current local
shape prepares for:

- wave id
- wave name
- wave description
- deployed state
- combatants assigned to a wave
- combat group/color preservation

No auth, RLS, Supabase wiring, importer logic, or external data fetching is
included in this pass.
