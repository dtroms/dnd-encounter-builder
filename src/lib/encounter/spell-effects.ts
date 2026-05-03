import type { SpellEffect } from "./types";

export const spellEffectOptions: Array<{ id: SpellEffect; label: string }> = [
  { id: "bless", label: "Bless" },
  { id: "bane", label: "Bane" },
  { id: "hunters_mark", label: "Hunter's Mark" },
  { id: "faerie_fire", label: "Faerie Fire" },
  { id: "hex", label: "Hex" },
  { id: "shield_of_faith", label: "Shield of Faith" },
  { id: "haste", label: "Haste" },
  { id: "slow", label: "Slow" },
  { id: "guiding_bolt", label: "Guiding Bolt" },
  { id: "sanctuary", label: "Sanctuary" },
  { id: "protection", label: "Protection" },
];

export function getSpellEffectLabel(effect: SpellEffect) {
  return (
    spellEffectOptions.find((option) => option.id === effect)?.label ?? effect
  );
}
