import type {
  CreatureTemplate,
  EncounterCombatant,
  StatBlockAction,
  StatBlockTrait,
} from "./types";
import type {
  SavedEncounterSummary,
} from "./dashboard-sample-data";
import type {
  CreatureTemplateRecord,
  CreatureTemplateRecordInput,
  EncounterRecord,
  EncounterCombatantRecord,
  EncounterCombatantRecordInput,
  InitiativeEntryRecord,
  StatBlockImportRecord,
} from "./db-types";

const defaultAbilityScores = {
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
};

const dashboardAccentColors = [
  "Blue",
  "Green",
  "Red",
  "Gold",
  "Purple",
  "Gray",
  "Cyan",
  "Magenta",
] as const;

type DashboardAccentColor = (typeof dashboardAccentColors)[number];

function normalizeDashboardAccentColor(
  value: string | null,
): DashboardAccentColor {
  return dashboardAccentColors.find((color) => color === value) ?? "Cyan";
}

function defaultDashboardText(value: string | null, fallback: string) {
  return value?.trim() || fallback;
}

export function encounterRecordToSavedEncounterSummary(
  record: EncounterRecord,
): SavedEncounterSummary {
  return {
    accent_color: normalizeDashboardAccentColor(record.accent_color),
    boss_count_snapshot: record.boss_count_snapshot ?? 0,
    campaign_id: "unassigned",
    campaign_name: "Unassigned",
    combatant_count_snapshot: record.combatant_count_snapshot ?? 0,
    combatants_preview: [],
    current_round: record.current_round,
    current_turn_index: record.current_turn_index,
    description: defaultDashboardText(
      record.description,
      "No description saved yet.",
    ),
    difficulty_label: defaultDashboardText(record.difficulty_label, "Unrated"),
    estimated_difficulty: defaultDashboardText(
      record.estimated_difficulty,
      record.difficulty_label ?? "Unrated",
    ),
    group_count: 0,
    has_lair_actions_snapshot: record.has_lair_actions_snapshot,
    id: record.id,
    last_played_at: record.last_played_at,
    location: defaultDashboardText(record.location, "No location set"),
    name: record.name,
    notes: record.notes ?? undefined,
    party_level: record.party_level ?? 1,
    party_size: record.party_size ?? 4,
    status: record.status,
    updated_at: record.updated_at,
  };
}

function mapActions(actions: StatBlockAction[] | undefined) {
  return actions ?? [];
}

function mapTraits(traits: StatBlockTrait[] | undefined) {
  return traits ?? [];
}

export function creatureTemplateRecordToCreatureTemplate(
  record: CreatureTemplateRecord,
): CreatureTemplate {
  return {
    id: record.id,
    name: record.name,
    type: record.creature_type,
    size: record.size ?? "Medium",
    armorClass: record.armor_class,
    maxHp: record.hit_points,
    speed: record.speed ?? "30 ft.",
    initiativeBonus: record.initiative_bonus,
    abilityScores: record.ability_scores ?? defaultAbilityScores,
    savingThrows: record.saving_throws,
    skills: record.skills,
    senses: record.senses ?? "passive Perception 10",
    languages: record.languages ?? "-",
    challengeRating: record.challenge_rating ?? undefined,
    traits: record.traits,
    actions: record.actions,
    bonusActions: record.bonus_actions,
    reactions: record.reactions,
    legendaryActions: record.legendary_actions,
    lairActions: record.lair_actions,
    notes: record.notes ?? undefined,
    tags: record.tags,
    accentColor: "Gray",
    autoRollEligible: record.creature_type !== "pc",
  };
}

export function creatureTemplateToRecordInput(
  template: CreatureTemplate,
  ownerUserId: string | null = null,
): CreatureTemplateRecordInput {
  return {
    owner_user_id: ownerUserId,
    name: template.name,
    creature_type: template.type,
    size: template.size,
    role: template.type,
    armor_class: template.armorClass,
    hit_points: template.maxHp,
    speed: template.speed,
    initiative_bonus: template.initiativeBonus,
    challenge_rating: template.challengeRating ?? null,
    proficiency_bonus: null,
    ability_scores: template.abilityScores,
    saving_throws: template.savingThrows ?? [],
    skills: template.skills ?? [],
    senses: template.senses,
    languages: template.languages,
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    traits: mapTraits(template.traits),
    actions: mapActions(template.actions),
    bonus_actions: mapActions(template.bonusActions),
    reactions: mapActions(template.reactions),
    legendary_actions: mapActions(template.legendaryActions),
    lair_actions: mapActions(template.lairActions),
    notes: template.notes ?? null,
    tags: template.tags,
    source_type: "custom",
    source_name: null,
    source_url: null,
    import_method: "manual",
    imported_at: null,
    original_import_text: null,
    import_notes: null,
    parser_version: null,
    parser_confidence: null,
    import_metadata: {},
  };
}

export function encounterCombatantRecordToEncounterCombatant(
  record: EncounterCombatantRecord,
): EncounterCombatant {
  return {
    id: record.creature_template_id ?? record.id,
    combatantId: record.id,
    templateId: record.creature_template_id ?? record.id,
    name: record.display_name,
    displayName: record.display_name,
    type: record.combatant_type,
    size: "Medium",
    armorClass: record.armor_class,
    maxHp: record.max_hp,
    currentHp: record.current_hp,
    speed: record.speed ?? "30 ft.",
    initiativeBonus: record.initiative_bonus,
    initiative: record.initiative_value,
    manualInitiative: record.initiative_manually_set,
    abilityScores: record.ability_scores ?? defaultAbilityScores,
    savingThrows: record.saving_throws,
    skills: record.skills,
    senses: record.senses ?? "passive Perception 10",
    languages: record.languages ?? "-",
    traits: record.traits,
    actions: record.actions,
    bonusActions: record.bonus_actions,
    reactions: record.reactions,
    legendaryActions: record.legendary_actions,
    lairActions: record.lair_actions,
    notes: record.notes ?? undefined,
    tags: record.tags,
    accentColor: "Gray",
    combatGroupId: undefined,
    combatGroupLabel: undefined,
    combatGroupColor: undefined,
    autoRollEligible: record.combatant_type !== "pc",
    conditions: record.conditions,
    spellEffects: [],
    waveId: record.wave_id ?? undefined,
  };
}

export function encounterCombatantToRecordInput(
  combatant: EncounterCombatant,
  encounterId: string,
  combatGroupId: string | null = null,
): EncounterCombatantRecordInput {
  return {
    encounter_id: encounterId,
    creature_template_id: combatant.templateId || null,
    display_name: combatant.displayName,
    combatant_type: combatant.type,
    role: combatant.type,
    armor_class: combatant.armorClass,
    max_hp: combatant.maxHp,
    current_hp: combatant.currentHp,
    temporary_hp: null,
    speed: combatant.speed,
    initiative_bonus: combatant.initiativeBonus,
    initiative_value: combatant.initiative,
    initiative_manually_set: combatant.manualInitiative,
    is_player_character: combatant.type === "pc",
    is_active: false,
    sort_order: null,
    combat_group_id: combatGroupId,
    wave_id: combatant.waveId ?? null,
    conditions: combatant.conditions,
    notes: combatant.notes ?? null,
    ability_scores: combatant.abilityScores,
    saving_throws: combatant.savingThrows ?? [],
    skills: combatant.skills ?? [],
    senses: combatant.senses,
    languages: combatant.languages,
    traits: mapTraits(combatant.traits),
    actions: mapActions(combatant.actions),
    bonus_actions: mapActions(combatant.bonusActions),
    reactions: mapActions(combatant.reactions),
    legendary_actions: mapActions(combatant.legendaryActions),
    lair_actions: mapActions(combatant.lairActions),
    tags: combatant.tags,
    snapshot_metadata: {
      combatGroupLabel: combatant.combatGroupLabel ?? "",
      combatGroupColor: combatant.combatGroupColor ?? "None",
    },
  };
}

export function statBlockImportRecordToDraftCreature(
  record: StatBlockImportRecord,
): Partial<CreatureTemplate> {
  return {
    notes: record.raw_text,
    tags: ["import-draft"],
  };
}

export function initiativeEntryRecordToTrackerEntry(record: InitiativeEntryRecord) {
  return {
    id: record.id,
    kind: record.entry_type,
    displayName: record.display_name,
    initiative: record.initiative_value,
    manualInitiative: record.initiative_manually_set,
    sourceCombatantId: record.source_combatant_id,
    isSynthetic: record.is_synthetic,
  };
}
