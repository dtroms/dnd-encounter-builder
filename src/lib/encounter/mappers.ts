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
  LibraryCreature,
  LibrarySourceType,
} from "./library-sample-data";
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

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function readMetadataString(
  metadata: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readMetadataBoolean(
  metadata: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const value = metadata[key];
  return typeof value === "boolean" ? value : undefined;
}

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
  const metadata = record.import_metadata as Record<string, unknown>;

  return {
    id: record.id,
    name: record.name,
    type: record.creature_type,
    size: record.size ?? "Medium",
    armorClassNote: readMetadataString(metadata, "armorClassNote"),
    hitPointFormula: readMetadataString(metadata, "hitPointFormula"),
    monsterType:
      (readMetadataString(metadata, "monsterType") as CreatureTemplate["monsterType"]) ??
      "Unknown / Unset",
    monsterSubtype: readMetadataString(metadata, "monsterSubtype"),
    alignment: readMetadataString(metadata, "alignment"),
    armorClass: record.armor_class,
    maxHp: record.hit_points,
    speed: record.speed ?? "30 ft.",
    initiativeBonus: record.initiative_bonus,
    abilityScores: record.ability_scores ?? defaultAbilityScores,
    savingThrows: record.saving_throws,
    skills: record.skills,
    damageVulnerabilities: readStringArray(record.vulnerabilities),
    damageResistances: readStringArray(record.resistances),
    damageImmunities: readStringArray(record.immunities),
    conditionImmunities: readStringArray(metadata.conditionImmunities),
    senses: record.senses ?? "passive Perception 10",
    languages: record.languages ?? "-",
    challengeRating: record.challenge_rating ?? undefined,
    challengeXp: readMetadataString(metadata, "challengeXp"),
    characterSheetUrl: readMetadataString(metadata, "characterSheetUrl"),
    characterSheetTitle: readMetadataString(metadata, "characterSheetTitle"),
    characterSheetEmbedEnabled: readMetadataBoolean(
      metadata,
      "characterSheetEmbedEnabled",
    ),
    externalSheetNotes: readMetadataString(metadata, "externalSheetNotes"),
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

export function creatureTemplateRecordToLibraryCreature(
  record: CreatureTemplateRecord,
): LibraryCreature {
  const metadata = record.import_metadata as Record<string, unknown>;
  const template = creatureTemplateRecordToCreatureTemplate(record);

  return {
    ...template,
    attribution: readMetadataString(metadata, "attribution"),
    importMethod: record.import_method ?? undefined,
    importNotes: record.import_notes ?? undefined,
    importedAt: record.imported_at ?? undefined,
    licenseName: readMetadataString(metadata, "licenseName") ?? "none/custom",
    parserConfidence: record.parser_confidence ?? undefined,
    parserVersion: record.parser_version ?? undefined,
    sourceDocumentVersion: readMetadataString(metadata, "sourceDocumentVersion"),
    sourceName: record.source_name ?? "User Created",
    sourceRawUrl: readMetadataString(metadata, "sourceRawUrl"),
    sourceType: record.source_type as LibrarySourceType,
    sourceUrl: record.source_url ?? undefined,
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

export function libraryCreatureToRecordInput(
  creature: LibraryCreature,
  ownerUserId: string | null = null,
): CreatureTemplateRecordInput {
  return {
    owner_user_id: ownerUserId,
    name: creature.name,
    creature_type: creature.type,
    size: creature.size,
    role: creature.type,
    armor_class: creature.armorClass,
    hit_points: creature.maxHp,
    speed: creature.speed,
    initiative_bonus: creature.initiativeBonus,
    challenge_rating: creature.challengeRating ?? null,
    proficiency_bonus: null,
    ability_scores: creature.abilityScores,
    saving_throws: creature.savingThrows ?? [],
    skills: creature.skills ?? [],
    senses: creature.senses,
    languages: creature.languages,
    resistances: creature.damageResistances ?? [],
    immunities: creature.damageImmunities ?? [],
    vulnerabilities: creature.damageVulnerabilities ?? [],
    traits: mapTraits(creature.traits),
    actions: mapActions(creature.actions),
    bonus_actions: mapActions(creature.bonusActions),
    reactions: mapActions(creature.reactions),
    legendary_actions: mapActions(creature.legendaryActions),
    lair_actions: mapActions(creature.lairActions),
    notes: creature.notes ?? null,
    tags: creature.tags,
    source_type: creature.sourceType,
    source_name: creature.sourceName,
    source_url: creature.sourceUrl ?? null,
    import_method: normalizeImportMethod(creature.importMethod),
    imported_at: creature.importedAt ?? null,
    original_import_text: creature.rawImportText ?? null,
    import_notes: creature.importNotes ?? null,
    parser_version: creature.parserVersion ?? null,
    parser_confidence: creature.parserConfidence ?? null,
    import_metadata: {
      alignment: creature.alignment ?? "",
      armorClassNote: creature.armorClassNote ?? "",
      attribution: creature.attribution ?? "",
      challengeXp: creature.challengeXp ?? "",
      characterSheetEmbedEnabled: creature.characterSheetEmbedEnabled ?? false,
      characterSheetTitle: creature.characterSheetTitle ?? "",
      characterSheetUrl: creature.characterSheetUrl ?? "",
      conditionImmunities: creature.conditionImmunities ?? [],
      externalSheetNotes: creature.externalSheetNotes ?? "",
      hitPointFormula: creature.hitPointFormula ?? "",
      licenseName: creature.licenseName,
      monsterSubtype: creature.monsterSubtype ?? "",
      monsterType: creature.monsterType ?? "Unknown / Unset",
      sourceDocumentVersion: creature.sourceDocumentVersion ?? "",
      sourceRawUrl: creature.sourceRawUrl ?? "",
    },
  };
}

function normalizeImportMethod(
  method: string | undefined,
): CreatureTemplateRecordInput["import_method"] {
  if (
    method === "paste" ||
    method === "url" ||
    method === "srd-json-review" ||
    method === "automated-srd-json" ||
    method === "dndbeyond_homebrew"
  ) {
    return method;
  }

  return "manual";
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
