import type {
  AbilityScores,
  MonsterType,
  StatBlockAction,
} from "./types";
import type { LibraryCreature } from "./library-sample-data";
import { normalizeStatBlockText } from "./stat-block-parser";

export type TabyltopSrdMonster = Record<string, unknown>;

export type SrdValidationStatus = "ready" | "needs-review" | "error";

export type SrdImportPreview = {
  creature: LibraryCreature;
  missingRequiredFields: string[];
  raw: TabyltopSrdMonster;
  status: SrdValidationStatus;
  warnings: string[];
};

export type SrdDatasetParseResult = {
  error?: string;
  records: TabyltopSrdMonster[];
  shape: string;
};

export const TABYLTOP_SRD_SOURCE = {
  attribution:
    "Contains content from the SRD 5.1 made available under CC-BY-4.0. Verify final attribution before public release.",
  licenseName: "CC-BY-4.0",
  sourceDocumentVersion: "SRD 5.1",
  sourceName: "Tabyltop CC-SRD",
  sourceUrl: "https://github.com/Tabyltop/CC-SRD",
} as const;

export const tabyltopSrdSampleMonsters: TabyltopSrdMonster[] = [
  {
    actions: [
      {
        desc: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        name: "Bite",
      },
    ],
    armor_class: "Armor Class 13",
    challenge: "Challenge 1/4 (50 XP)",
    hit_points: "Hit Points 11 (2d8 + 2)",
    languages: "Languages --",
    meta: "Medium beast, unaligned",
    name: "SRD Training Wolf",
    senses: "Senses passive Perception 13",
    speed: "Speed 40 ft.",
    stats: {
      cha: 6,
      con: 12,
      dex: 15,
      int: 3,
      str: 12,
      wis: 12,
    },
    traits: [
      {
        desc: "The creature has advantage on Wisdom (Perception) checks that rely on hearing or smell.",
        name: "Keen Hearing and Smell",
      },
    ],
  },
  {
    actions: [
      {
        desc: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) slashing damage.",
        name: "Scimitar",
      },
    ],
    armor_class: "Armor Class 15 (leather armor, shield)",
    challenge_rating: "1/2",
    hit_points: "Hit Points 16 (3d8 + 3)",
    languages: "Languages Common, Goblin",
    meta: "Medium humanoid (goblinoid), neutral evil",
    name: "SRD Training Scout",
    saving_throws: "Dex +4",
    senses: "Senses darkvision 60 ft., passive Perception 10",
    skills: "Stealth +6",
    speed: "Speed 30 ft.",
    str: 10,
    dex: 14,
    con: 12,
    int: 10,
    wis: 10,
    cha: 8,
    traits: [
      {
        desc: "The creature can take the Disengage or Hide action as a bonus action on each of its turns.",
        name: "Nimble Escape",
      },
    ],
  },
  {
    actions: [
      {
        desc: "Ranged Spell Attack: +5 to hit, range 120 ft., one target. Hit: 10 (3d6) radiant damage.",
        name: "Radiant Bolt",
      },
    ],
    armor_class: "Armor Class 12",
    challenge: "Challenge 2 (450 XP)",
    condition_immunities: "charmed",
    hit_points: "Hit Points 45 (10d8)",
    languages: "Languages Celestial, Common",
    legendary_actions: [
      {
        desc: "The creature makes a Wisdom (Perception) check.",
        name: "Detect",
      },
    ],
    meta: "Medium celestial, lawful good",
    name: "SRD Training Lantern",
    senses: "Senses darkvision 60 ft., passive Perception 14",
    speed: "Speed 30 ft., fly 30 ft.",
    stats: [10, 14, 10, 13, 15, 16],
    traits: [
      {
        desc: "The creature sheds bright light in a 10-foot radius and dim light for an additional 10 feet.",
        name: "Guiding Light",
      },
    ],
  },
];

export function normalizeTabyltopSrdMonster(
  raw: TabyltopSrdMonster,
): SrdImportPreview {
  const warnings: string[] = [];
  const criticalErrors: string[] = [];

  if (!isPlainObject(raw)) {
    const creature = buildInvalidCreature("Malformed SRD Record", raw);

    return {
      creature,
      missingRequiredFields: ["malformed record object"],
      raw,
      status: "error",
      warnings: ["Malformed record object."],
    };
  }

  const name = readString(raw, ["name", "Name"]);
  const meta = readString(raw, ["meta", "Meta", "size_type_alignment"]);
  const identity = parseMeta(meta);
  const armor = parseNumberAndNote(
    readString(raw, ["armor_class", "armorClass", "Armor Class", "ac", "AC"]),
  );
  const hp = parseNumberAndNote(
    readString(raw, ["hit_points", "hitPoints", "Hit Points", "hp", "HP"]),
  );
  const challenge = parseChallenge(
    readString(raw, ["challenge", "challenge_rating", "Challenge", "CR", "cr"]),
  );
  const abilityResult = parseSrdAbilityScores(raw);
  const abilityScores = abilityResult.scores;
  const speed = stripLeadingLabel(readString(raw, ["speed", "Speed"]), "Speed");
  const actions = readEntries(raw, ["actions", "Actions"]);
  const traits = readEntries(raw, ["traits", "special_abilities", "Special Abilities"]);
  const bonusActions = readEntries(raw, ["bonus_actions", "Bonus Actions"]);
  const reactions = readEntries(raw, ["reactions", "Reactions"]);
  const legendaryActions = readEntries(raw, [
    "legendary_actions",
    "Legendary Actions",
  ]);
  const lairActions = readEntries(raw, ["lair_actions", "Lair Actions"]);
  const savingThrows = splitList(
    stripLeadingLabel(readString(raw, ["saving_throws", "Saving Throws"]), "Saving Throws"),
  );
  const skills = splitList(stripLeadingLabel(readString(raw, ["skills", "Skills"]), "Skills"));
  const senses =
    stripLeadingLabel(readString(raw, ["senses", "Senses"]), "Senses") ||
    "passive Perception 10";
  const languages =
    stripLeadingLabel(readString(raw, ["languages", "Languages"]), "Languages") ||
    "None";
  const damageVulnerabilities = splitList(
    stripLeadingLabel(
      readString(raw, ["damage_vulnerabilities", "Damage Vulnerabilities"]),
      "Damage Vulnerabilities",
    ),
  );
  const damageResistances = splitList(
    stripLeadingLabel(
      readString(raw, ["damage_resistances", "Damage Resistances"]),
      "Damage Resistances",
    ),
  );
  const damageImmunities = splitList(
    stripLeadingLabel(
      readString(raw, ["damage_immunities", "Damage Immunities"]),
      "Damage Immunities",
    ),
  );
  const conditionImmunities = splitList(
    stripLeadingLabel(
      readString(raw, ["condition_immunities", "Condition Immunities"]),
      "Condition Immunities",
    ),
  );

  const creature: LibraryCreature = {
    accentColor: "Emerald",
    actions,
    alignment: identity.alignment,
    armorClass: armor.value ?? 10,
    armorClassNote: armor.note,
    attribution: TABYLTOP_SRD_SOURCE.attribution,
    autoRollEligible: true,
    bonusActions,
    challengeRating: challenge.value,
    challengeXp: challenge.xp,
    conditionImmunities,
    damageImmunities,
    damageResistances,
    damageVulnerabilities,
    abilityScores,
    hitPointFormula: hp.note,
    id: `srd-${slugify(name || "unknown")}`,
    importMethod: "srd-json-review",
    initiativeBonus: abilityModifier(abilityScores.dex),
    lairActions,
    languages,
    legendaryActions,
    licenseName: TABYLTOP_SRD_SOURCE.licenseName,
    maxHp: hp.value ?? 1,
    monsterSubtype: identity.subtype,
    monsterType: identity.monsterType,
    name,
    normalizedRawImportText: normalizeStatBlockText(JSON.stringify(raw, null, 2)),
    notes: [
      `Imported from ${TABYLTOP_SRD_SOURCE.sourceName} preview data.`,
      `Source document: ${TABYLTOP_SRD_SOURCE.sourceDocumentVersion}.`,
      "Review normalized fields before public use.",
    ].join("\n"),
    rawImportText: JSON.stringify(raw, null, 2),
    reactions,
    savingThrows,
    senses,
    size: identity.size,
    skills,
    sourceName: TABYLTOP_SRD_SOURCE.sourceName,
    sourceType: "srd",
    sourceUrl: TABYLTOP_SRD_SOURCE.sourceUrl,
    speed,
    tags: ["srd", "cc-by-4.0", "tabyltop-import"],
    traits,
    type: legendaryActions.length || lairActions.length ? "boss" : "enemy",
  };

  const missingRequiredFields = validateSrdMonsterDraft(creature);

  if (!name) {
    criticalErrors.push("Missing name.");
  }

  if (armor.value === null) {
    criticalErrors.push("Missing or invalid Armor Class.");
  }

  if (hp.value === null) {
    criticalErrors.push("Missing or invalid Hit Points.");
  }

  if (!challenge.value) {
    criticalErrors.push("Missing or invalid challenge rating.");
  }

  if (!abilityResult.detected) {
    criticalErrors.push("Ability scores were not detected.");
  }

  if (!identity.monsterType || identity.monsterType === "Unknown / Unset") {
    criticalErrors.push("Monster type could not be determined.");
  }

  if (hasBadCoreNumber(creature)) {
    criticalErrors.push("NaN or invalid numeric value detected in core fields.");
  }

  if (entriesMalformed(raw, ["actions", "Actions"])) {
    criticalErrors.push("Actions data is malformed.");
  }

  if (entriesMalformed(raw, ["traits", "special_abilities", "Special Abilities"])) {
    criticalErrors.push("Traits data is malformed.");
  }

  if (!meta) {
    warnings.push("Missing size/type/alignment metadata.");
  }

  if (!actions.length) {
    warnings.push("No actions were detected.");
  }

  if (!traits.length) {
    warnings.push("No traits were detected.");
  }

  if (armor.value === null) {
    warnings.push("Armor Class could not be parsed from source text.");
  }

  if (hp.value === null) {
    warnings.push("Hit Points could not be parsed from source text.");
  }

  const allMissingFields = [...new Set([...missingRequiredFields, ...criticalErrors])];

  const status: SrdValidationStatus = criticalErrors.length
    ? "error"
    : warnings.length
      ? "needs-review"
      : "ready";

  return {
    creature,
    missingRequiredFields: allMissingFields,
    raw,
    status,
    warnings: [...criticalErrors, ...warnings],
  };
}

export function validateSrdMonsterDraft(creature: LibraryCreature) {
  return [
    !creature.name.trim() ? "name" : null,
    !Number.isFinite(creature.armorClass) || creature.armorClass <= 0
      ? "armor class"
      : null,
    !Number.isFinite(creature.maxHp) || creature.maxHp <= 0 ? "hit points" : null,
    !creature.speed.trim() ? "speed" : null,
    !creature.challengeRating?.trim() ? "challenge rating" : null,
    !creature.monsterType || creature.monsterType === "Unknown / Unset"
      ? "creature type"
      : null,
    !hasValidAbilityScores(creature.abilityScores) ? "ability scores" : null,
  ].filter(Boolean) as string[];
}

export function tabyltopMonsterToCreatureTemplate(raw: TabyltopSrdMonster) {
  return normalizeTabyltopSrdMonster(raw).creature;
}

export function parseSrdMonsterDataset(jsonText: string): SrdDatasetParseResult {
  if (!jsonText.trim()) {
    return { error: "Paste SRD monster JSON before processing.", records: [], shape: "empty" };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `JSON could not be parsed: ${error.message}`
          : "JSON could not be parsed.",
      records: [],
      shape: "invalid-json",
    };
  }

  return extractSrdMonsterRecords(parsed);
}

export function extractSrdMonsterRecords(parsed: unknown): SrdDatasetParseResult {
  if (Array.isArray(parsed)) {
    return {
      records: parsed.filter(isPlainObject) as TabyltopSrdMonster[],
      shape: "array",
    };
  }

  if (!isPlainObject(parsed)) {
    return {
      error: "JSON shape was not recognized. Expected an array or object.",
      records: [],
      shape: "unrecognized",
    };
  }

  for (const key of ["monsters", "data", "results"]) {
    const value = parsed[key];

    if (Array.isArray(value)) {
      return {
        records: value.filter(isPlainObject) as TabyltopSrdMonster[],
        shape: `object.${key}`,
      };
    }
  }

  const values = Object.values(parsed);
  const keyedRecords = values.filter(isPlainObject) as TabyltopSrdMonster[];

  if (keyedRecords.length) {
    return { records: keyedRecords, shape: "keyed-object" };
  }

  return {
    error:
      "JSON shape was not recognized. Use an array, { monsters: [...] }, { data: [...] }, { results: [...] }, or a keyed object.",
    records: [],
    shape: "unrecognized",
  };
}

function readString(raw: TabyltopSrdMonster, keys: string[]) {
  for (const key of keys) {
    const value = raw[key];

    if (typeof value === "string" || typeof value === "number") {
      return String(value).trim();
    }
  }

  return "";
}

function readEntries(raw: TabyltopSrdMonster, keys: string[]): StatBlockAction[] {
  for (const key of keys) {
    const value = raw[key];

    if (Array.isArray(value)) {
      return value
        .map((entry, index) => normalizeEntry(entry, index))
        .filter((entry) => entry.description);
    }

    if (typeof value === "string") {
      return value
        .split(/\n+/)
        .map((line, index) => normalizeEntry(line, index))
        .filter((entry) => entry.description);
    }
  }

  return [];
}

function normalizeEntry(entry: unknown, index: number): StatBlockAction {
  if (typeof entry === "string") {
    const match = entry.match(/^(.{2,80}?)(?:\.|:)\s+(.+)$/);
    return match
      ? { description: match[2].trim(), name: match[1].trim() }
      : { description: entry.trim(), name: `Entry ${index + 1}` };
  }

  if (entry && typeof entry === "object") {
    const record = entry as Record<string, unknown>;
    return {
      description: String(record.desc ?? record.description ?? record.text ?? "").trim(),
      name: String(record.name ?? record.title ?? `Entry ${index + 1}`).trim(),
    };
  }

  return { description: "", name: `Entry ${index + 1}` };
}

function parseMeta(meta: string) {
  const match = meta.match(
    /^(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+([A-Za-z ]+?)(?:\s*\(([^)]+)\))?(?:,\s*(.+))?$/i,
  );
  const typeText = match?.[2]?.trim() ?? "";
  const monsterType =
    monsterTypes.find(
      (type) =>
        type !== "Custom / Other" &&
        type !== "Unknown / Unset" &&
        type.toLowerCase() === typeText.toLowerCase(),
    ) ?? "Unknown / Unset";

  return {
    alignment: match?.[4]?.trim(),
    monsterType,
    size: match?.[1] ?? "Medium",
    subtype: match?.[3]?.trim(),
  };
}

function parseNumberAndNote(value: string) {
  const stripped = value.replace(/^(Armor Class|AC|Hit Points|HP)\s*:?/i, "").trim();
  const match = stripped.match(/^(\d+)(?:\s*\(([^)]*)\))?/);

  return {
    note: match?.[2]?.trim() || undefined,
    value: match ? safeNumber(match[1]) : null,
  };
}

function parseChallenge(value: string) {
  const stripped = value
    .replace(/^(Challenge Rating|Challenge|CR)\s*:?/i, "")
    .trim();
  const match = stripped.match(/^([0-9]+(?:\/[0-9]+)?)(?:\s*\(([^)]*)\))?/);

  return {
    value: match?.[1]?.trim() ?? stripped,
    xp: match?.[2]?.trim(),
  };
}

function parseSrdAbilityScores(raw: TabyltopSrdMonster): {
  detected: boolean;
  scores: AbilityScores;
} {
  const stats = raw.stats;

  if (Array.isArray(stats) && stats.length >= 6) {
    return {
      detected: true,
      scores: {
      cha: safeNumber(stats[5]) ?? 10,
      con: safeNumber(stats[2]) ?? 10,
      dex: safeNumber(stats[1]) ?? 10,
      int: safeNumber(stats[3]) ?? 10,
      str: safeNumber(stats[0]) ?? 10,
      wis: safeNumber(stats[4]) ?? 10,
      },
    };
  }

  if (stats && typeof stats === "object") {
    const record = stats as Record<string, unknown>;
    return {
      detected: hasAbilityKeys(record),
      scores: {
        cha: safeNumber(record.cha ?? record.CHA ?? record.charisma) ?? 10,
        con: safeNumber(record.con ?? record.CON ?? record.constitution) ?? 10,
        dex: safeNumber(record.dex ?? record.DEX ?? record.dexterity) ?? 10,
        int: safeNumber(record.int ?? record.INT ?? record.intelligence) ?? 10,
        str: safeNumber(record.str ?? record.STR ?? record.strength) ?? 10,
        wis: safeNumber(record.wis ?? record.WIS ?? record.wisdom) ?? 10,
      },
    };
  }

  const detected = ["str", "dex", "con", "int", "wis", "cha"].every(
    (key) => raw[key] !== undefined || raw[key.toUpperCase()] !== undefined,
  );

  return {
    detected,
    scores: {
      cha: safeNumber(raw.cha ?? raw.CHA ?? raw.charisma) ?? 10,
      con: safeNumber(raw.con ?? raw.CON ?? raw.constitution) ?? 10,
      dex: safeNumber(raw.dex ?? raw.DEX ?? raw.dexterity) ?? 10,
      int: safeNumber(raw.int ?? raw.INT ?? raw.intelligence) ?? 10,
      str: safeNumber(raw.str ?? raw.STR ?? raw.strength) ?? 10,
      wis: safeNumber(raw.wis ?? raw.WIS ?? raw.wisdom) ?? 10,
    },
  };
}

function stripLeadingLabel(value: string, label: string) {
  return value.replace(new RegExp(`^${escapeRegExp(label)}\\s*:?\\s*`, "i"), "");
}

function splitList(value: string) {
  if (!value || /^none|--|-$/i.test(value)) {
    return [];
  }

  return value
    .replace(/\band\b/g, ",")
    .split(/,|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function safeNumber(value: unknown) {
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function buildInvalidCreature(
  name: string,
  raw: unknown,
): LibraryCreature {
  return {
    accentColor: "Emerald",
    actions: [],
    armorClass: 0,
    attribution: TABYLTOP_SRD_SOURCE.attribution,
    autoRollEligible: true,
    challengeRating: "",
    abilityScores: { cha: 10, con: 10, dex: 10, int: 10, str: 10, wis: 10 },
    id: `srd-invalid-${Date.now()}`,
    importMethod: "srd-json-review",
    initiativeBonus: 0,
    languages: "None",
    licenseName: TABYLTOP_SRD_SOURCE.licenseName,
    maxHp: 0,
    monsterType: "Unknown / Unset",
    name,
    notes: "Invalid SRD record. Skipped by validation.",
    rawImportText: JSON.stringify(raw, null, 2),
    senses: "passive Perception 10",
    size: "Medium",
    sourceName: TABYLTOP_SRD_SOURCE.sourceName,
    sourceType: "srd",
    sourceUrl: TABYLTOP_SRD_SOURCE.sourceUrl,
    speed: "",
    tags: ["srd", "validation-error"],
    traits: [],
    type: "enemy",
  };
}

function entriesMalformed(raw: TabyltopSrdMonster, keys: string[]) {
  return keys.some((key) => {
    const value = raw[key];
    return (
      value !== undefined &&
      typeof value !== "string" &&
      !Array.isArray(value)
    );
  });
}

function hasAbilityKeys(record: Record<string, unknown>) {
  return ["str", "dex", "con", "int", "wis", "cha"].every(
    (key) => record[key] !== undefined || record[key.toUpperCase()] !== undefined,
  );
}

function hasBadCoreNumber(creature: LibraryCreature) {
  return [creature.armorClass, creature.maxHp, creature.initiativeBonus].some(
    (value) => !Number.isFinite(value),
  );
}

function hasValidAbilityScores(scores: AbilityScores) {
  return Object.values(scores).every((score) => Number.isFinite(score) && score > 0);
}

function isPlainObject(value: unknown): value is TabyltopSrdMonster {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const monsterTypes: MonsterType[] = [
  "Aberration",
  "Beast",
  "Celestial",
  "Construct",
  "Dragon",
  "Elemental",
  "Fey",
  "Fiend",
  "Giant",
  "Humanoid",
  "Monstrosity",
  "Ooze",
  "Plant",
  "Undead",
  "Custom / Other",
  "Unknown / Unset",
];
