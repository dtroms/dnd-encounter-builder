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
  diagnostics: SrdImportDiagnostics;
  error?: string;
  records: TabyltopSrdMonster[];
  shape: string;
};

export type SrdCollectionDiagnostic = {
  monsterLikeCount: number;
  path: string;
  recordCount: number;
  sampleKeys: string[][];
  score: number;
};

export type SrdImportDiagnostics = {
  candidateCollections: SrdCollectionDiagnostic[];
  chosenPath?: string;
  rootType: "array" | "object" | "other";
  sampleRecordKeys: string[][];
  topLevelKeys: string[];
  totalCandidateRecords: number;
};

export type TabyltopSrdFetchResult = {
  byteLength: number;
  jsonText: string;
};

export const TABYLTOP_CC_SRD_RAW_URL =
  "https://raw.githubusercontent.com/Tabyltop/CC-SRD/main/SRD5.1-CCBY4.0License-TT.json";

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
    sourceDocumentVersion: TABYLTOP_SRD_SOURCE.sourceDocumentVersion,
    sourceType: "srd",
    sourceRawUrl: TABYLTOP_CC_SRD_RAW_URL,
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
    criticalErrors.push("Missing required field: ability scores.");
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

  if (!identity.monsterType || identity.monsterType === "Unknown / Unset") {
    warnings.push("Monster type could not be determined; defaulted to Custom / Other.");
    creature.monsterType = "Custom / Other";
  }

  if (!identity.size) {
    warnings.push("Size could not be determined; defaulted to Medium.");
    creature.size = "Medium";
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

  const allMissingFields = [
    ...new Set(
      [...missingRequiredFields, ...criticalErrors].map(normalizeValidationMessage),
    ),
  ];

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
    !hasValidAbilityScores(creature.abilityScores) ? "ability scores" : null,
  ].filter(Boolean) as string[];
}

export function tabyltopMonsterToCreatureTemplate(raw: TabyltopSrdMonster) {
  return normalizeTabyltopSrdMonster(raw).creature;
}

export async function fetchTabyltopCcSrdJson({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<TabyltopSrdFetchResult> {
  const response = await fetch(TABYLTOP_CC_SRD_RAW_URL, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `GitHub returned ${response.status} ${response.statusText || "for the SRD JSON request"}.`,
    );
  }

  const jsonText = await response.text();

  return {
    byteLength: new Blob([jsonText]).size,
    jsonText,
  };
}

export function parseSrdMonsterDataset(jsonText: string): SrdDatasetParseResult {
  if (!jsonText.trim()) {
    return {
      diagnostics: createSrdDiagnostics(undefined),
      error: "Paste SRD monster JSON before processing.",
      records: [],
      shape: "empty",
    };
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
      diagnostics: createSrdDiagnostics(undefined),
      shape: "invalid-json",
    };
  }

  return extractSrdMonsterRecords(parsed);
}

export function extractSrdMonsterRecords(parsed: unknown): SrdDatasetParseResult {
  const diagnostics = createSrdDiagnostics(parsed);

  if (Array.isArray(parsed)) {
    const records = parsed.filter(isMonsterLikeRecord);

    if (records.length) {
      return {
        diagnostics: {
          ...diagnostics,
          chosenPath: "$",
          sampleRecordKeys: sampleRecordKeys(records),
          totalCandidateRecords: records.length,
        },
        records,
        shape: "array",
      };
    }

    const documentRecords = extractTabyltopDocumentMonsterRecords(parsed);

    if (documentRecords.length) {
      return {
        diagnostics: {
          ...diagnostics,
          candidateCollections: [
            {
              monsterLikeCount: documentRecords.length,
              path: "tabyltop-document-blocks",
              recordCount: documentRecords.length,
              sampleKeys: sampleRecordKeys(documentRecords),
              score: documentRecords.length,
            },
            ...diagnostics.candidateCollections,
          ],
          chosenPath: "tabyltop-document-blocks",
          sampleRecordKeys: sampleRecordKeys(documentRecords),
          totalCandidateRecords: documentRecords.length,
        },
        records: documentRecords,
        shape: "tabyltop-document-blocks",
      };
    }

    if (!records.length) {
      return {
        error: "Could not find monster records in this SRD JSON.",
        diagnostics,
        records: [],
        shape: "array",
      };
    }
  }

  if (!isPlainObject(parsed)) {
    return {
      error: "JSON shape was not recognized. Expected an array or object.",
      diagnostics,
      records: [],
      shape: "unrecognized",
    };
  }

  const bestCollection = diagnostics.candidateCollections[0];

  if (bestCollection) {
    const records = readPath(parsed, bestCollection.path).filter(isMonsterLikeRecord);

    if (records.length) {
      return {
        diagnostics: {
          ...diagnostics,
          chosenPath: bestCollection.path,
          sampleRecordKeys: sampleRecordKeys(records),
          totalCandidateRecords: records.length,
        },
        records,
        shape: bestCollection.path,
      };
    }
  }

  for (const key of ["monsters", "Monsters", "creatures", "data", "results"]) {
    const value = parsed[key];

    if (Array.isArray(value)) {
      const records = value.filter(isMonsterLikeRecord);

      if (!records.length) {
        continue;
      }

      return {
        diagnostics: {
          ...diagnostics,
          chosenPath: `object.${key}`,
          sampleRecordKeys: sampleRecordKeys(records),
          totalCandidateRecords: records.length,
        },
        records,
        shape: `object.${key}`,
      };
    }
  }

  const values = Object.values(parsed);
  const keyedRecords = values.filter(isMonsterLikeRecord);

  if (keyedRecords.length) {
    return {
      diagnostics: {
        ...diagnostics,
        chosenPath: "keyed-object",
        sampleRecordKeys: sampleRecordKeys(keyedRecords),
        totalCandidateRecords: keyedRecords.length,
      },
      records: keyedRecords,
      shape: "keyed-object",
    };
  }

  const nested = findNestedMonsterRecords(parsed);

  if (nested.records.length) {
    return nested;
  }

  return {
    error:
      "Could not find monster records in this SRD JSON. Use an array, { monsters: [...] }, { data: [...] }, { results: [...] }, a keyed monster object, or paste only the monster section.",
    diagnostics,
    records: [],
    shape: "unrecognized",
  };
}

function readString(raw: TabyltopSrdMonster, keys: string[]) {
  for (const key of keys) {
    const value = readValue(raw, key);

    if (typeof value === "string" || typeof value === "number") {
      return String(value).trim();
    }

    if (Array.isArray(value)) {
      return value.map(stringifySrdValue).filter(Boolean).join(", ").trim();
    }

    if (isPlainObject(value)) {
      return stringifySrdValue(value).trim();
    }
  }

  return "";
}

function readEntries(raw: TabyltopSrdMonster, keys: string[]): StatBlockAction[] {
  for (const key of keys) {
    const value = readValue(raw, key);

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
    /^(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+(.+?)(?:,\s*(.+))?$/i,
  );
  const rawTypeText = match?.[2]?.trim() ?? "";
  const subtypeMatch = rawTypeText.match(/^(.+?)\s*\(([^)]+)\)$/);
  const typeText = (subtypeMatch?.[1] ?? rawTypeText)
    .replace(/^swarm of\s+(?:Tiny|Small|Medium|Large|Huge|Gargantuan)\s+/i, "")
    .replace(/s$/i, "")
    .trim();
  const monsterType =
    monsterTypes.find(
      (type) =>
        type !== "Custom / Other" &&
        type !== "Unknown / Unset" &&
        type.toLowerCase() === typeText.toLowerCase(),
    ) ?? "Unknown / Unset";

  return {
    alignment: match?.[3]?.trim(),
    monsterType,
    size: match?.[1] ?? "",
    subtype: subtypeMatch?.[2]?.trim(),
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
  const stats = readValue(raw, "stats") ?? readValue(raw, "ability_scores") ?? readValue(raw, "abilityScores");

  if (Array.isArray(stats) && stats.length >= 6) {
    const values = stats.map(parseAbilityScoreValue);
    return {
      detected: values.every((value) => value !== null),
      scores: {
      cha: values[5] ?? 10,
      con: values[2] ?? 10,
      dex: values[1] ?? 10,
      int: values[3] ?? 10,
      str: values[0] ?? 10,
      wis: values[4] ?? 10,
      },
    };
  }

  if (isPlainObject(stats)) {
    const record = stats;
    const parsed = {
      cha: parseAbilityScoreValue(readAbilityValue(record, "cha")),
      con: parseAbilityScoreValue(readAbilityValue(record, "con")),
      dex: parseAbilityScoreValue(readAbilityValue(record, "dex")),
      int: parseAbilityScoreValue(readAbilityValue(record, "int")),
      str: parseAbilityScoreValue(readAbilityValue(record, "str")),
      wis: parseAbilityScoreValue(readAbilityValue(record, "wis")),
    };

    return {
      detected: Object.values(parsed).every((value) => value !== null),
      scores: {
        cha: parsed.cha ?? 10,
        con: parsed.con ?? 10,
        dex: parsed.dex ?? 10,
        int: parsed.int ?? 10,
        str: parsed.str ?? 10,
        wis: parsed.wis ?? 10,
      },
    };
  }

  const abilityKeys: Array<keyof AbilityScores> = [
    "str",
    "dex",
    "con",
    "int",
    "wis",
    "cha",
  ];
  const detected = abilityKeys.every(
    (key) => readAbilityValue(raw, key) !== undefined,
  );

  return {
    detected,
    scores: {
      cha: parseAbilityScoreValue(readAbilityValue(raw, "cha")) ?? 10,
      con: parseAbilityScoreValue(readAbilityValue(raw, "con")) ?? 10,
      dex: parseAbilityScoreValue(readAbilityValue(raw, "dex")) ?? 10,
      int: parseAbilityScoreValue(readAbilityValue(raw, "int")) ?? 10,
      str: parseAbilityScoreValue(readAbilityValue(raw, "str")) ?? 10,
      wis: parseAbilityScoreValue(readAbilityValue(raw, "wis")) ?? 10,
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

function parseAbilityScoreValue(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  const match = String(value).match(/\d+/);

  return match ? safeNumber(match[0]) : null;
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
    sourceDocumentVersion: TABYLTOP_SRD_SOURCE.sourceDocumentVersion,
    sourceRawUrl: TABYLTOP_CC_SRD_RAW_URL,
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
    const value = readValue(raw, key);
    return (
      value !== undefined &&
      typeof value !== "string" &&
      !Array.isArray(value)
    );
  });
}

function readAbilityValue(raw: TabyltopSrdMonster, key: keyof AbilityScores) {
  const fullNames: Record<keyof AbilityScores, string> = {
    cha: "charisma",
    con: "constitution",
    dex: "dexterity",
    int: "intelligence",
    str: "strength",
    wis: "wisdom",
  };

  return (
    readValue(raw, key) ??
    readValue(raw, key.toUpperCase()) ??
    readValue(raw, fullNames[key]) ??
    readValue(raw, titleCase(fullNames[key]))
  );
}

function readValue(raw: TabyltopSrdMonster, key: string) {
  if (raw[key] !== undefined) {
    return raw[key];
  }

  const normalizedKey = normalizeKey(key);
  const matchingKey = Object.keys(raw).find(
    (candidate) => normalizeKey(candidate) === normalizedKey,
  );

  return matchingKey ? raw[matchingKey] : undefined;
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeValidationMessage(value: string) {
  const normalized = value.trim().replace(/\.+$/g, "").toLowerCase();
  const labels: Record<string, string> = {
    "ability scores": "ability scores",
    "missing required field: ability scores": "ability scores",
  };

  return labels[normalized] ?? value.trim().replace(/\.+$/g, "");
}

function stringifySrdValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(stringifySrdValue).filter(Boolean).join(", ");
  }

  if (isPlainObject(value)) {
    const record = value as Record<string, unknown>;
    const preferred =
      record.name ??
      record.desc ??
      record.description ??
      record.text ??
      record.value ??
      record.type;

    if (preferred !== undefined) {
      return stringifySrdValue(preferred);
    }

    return Object.values(record).map(stringifySrdValue).filter(Boolean).join(" ");
  }

  return "";
}

function extractTabyltopDocumentMonsterRecords(
  blocks: unknown[],
): TabyltopSrdMonster[] {
  const records: TabyltopSrdMonster[] = [];
  const monsterSectionStart = blocks.findIndex(
    (block) =>
      readDocumentBlockType(block) === "h1" &&
      /^Monsters$/i.test(readDocumentBlockText(block)),
  );

  if (monsterSectionStart === -1) {
    return records;
  }

  for (let index = monsterSectionStart + 1; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (!isDocumentMonsterHeading(block, blocks, index)) {
      continue;
    }

    const nextIndex = findNextDocumentMonsterBoundary(blocks, index + 1);
    const record = buildMonsterRecordFromDocumentBlocks(
      readDocumentBlockText(block),
      blocks.slice(index + 1, nextIndex),
    );

    if (record) {
      records.push(record);
    }

    index = Math.max(index, nextIndex - 1);
  }

  return records;
}

function isDocumentMonsterHeading(
  block: unknown,
  blocks: unknown[],
  index: number,
) {
  const type = readDocumentBlockType(block);
  const text = readDocumentBlockText(block);

  if (type !== "h4" || !text || isDocumentMonsterSectionHeading(text)) {
    return false;
  }

  const lookAhead = blocks
    .slice(index + 1, index + 12)
    .map(readDocumentBlockText)
    .join("\n");

  return /Armor Class/i.test(lookAhead) && /Hit Points/i.test(lookAhead);
}

function findNextDocumentMonsterBoundary(blocks: unknown[], startIndex: number) {
  for (let index = startIndex; index < blocks.length; index += 1) {
    const type = readDocumentBlockType(blocks[index]);

    if (type === "h1" || type === "h2" || type === "h3") {
      return index;
    }

    if (isDocumentMonsterHeading(blocks[index], blocks, index)) {
      return index;
    }
  }

  return blocks.length;
}

function buildMonsterRecordFromDocumentBlocks(
  name: string,
  blocks: unknown[],
): TabyltopSrdMonster | null {
  const record: TabyltopSrdMonster = { name };
  const traits: StatBlockAction[] = [];
  const actions: StatBlockAction[] = [];
  const bonusActions: StatBlockAction[] = [];
  const reactions: StatBlockAction[] = [];
  const legendaryActions: StatBlockAction[] = [];
  const lairActions: StatBlockAction[] = [];
  const notes: string[] = [];
  let section:
    | "traits"
    | "actions"
    | "bonusActions"
    | "reactions"
    | "legendaryActions"
    | "lairActions" = "traits";
  let challengeFound = false;
  let metaFound = false;

  blocks.forEach((block) => {
    const type = readDocumentBlockType(block);
    const text = readDocumentBlockText(block);

    if (!text) {
      return;
    }

    if (type === "table") {
      const scores = extractAbilityScoresFromDocumentTable(block);

      if (scores.length === 6) {
        record.stats = scores;
      }

      return;
    }

    if (type === "h4") {
      const normalized = text.toLowerCase();
      if (normalized === "actions") section = "actions";
      if (normalized === "bonus actions") section = "bonusActions";
      if (normalized === "reactions") section = "reactions";
      if (normalized === "legendary actions") section = "legendaryActions";
      if (normalized === "lair actions") section = "lairActions";
      return;
    }

    if (!metaFound && /^[A-Z][a-z]+ [a-z]+/.test(text) && !/^Armor Class/i.test(text)) {
      record.meta = text;
      metaFound = true;
      return;
    }

    if (/^Armor Class/i.test(text)) {
      record.armor_class = text;
      return;
    }

    if (/^Hit Points/i.test(text)) {
      record.hit_points = text;
      return;
    }

    if (/^Speed/i.test(text)) {
      record.speed = text;
      return;
    }

    if (/^Saving Throws/i.test(text)) {
      record.saving_throws = text;
      return;
    }

    if (/^Skills/i.test(text)) {
      record.skills = text;
      return;
    }

    if (/^Damage Vulnerabilities/i.test(text)) {
      record.damage_vulnerabilities = text;
      return;
    }

    if (/^Damage Resistances/i.test(text)) {
      record.damage_resistances = text;
      return;
    }

    if (/^Damage Immunities/i.test(text)) {
      record.damage_immunities = text;
      return;
    }

    if (/^Condition Immunities/i.test(text)) {
      record.condition_immunities = text;
      return;
    }

    if (/^Senses/i.test(text)) {
      record.senses = text;
      return;
    }

    if (/^Languages/i.test(text)) {
      record.languages = text;
      return;
    }

    if (/^Challenge/i.test(text)) {
      record.challenge = text;
      challengeFound = true;
      return;
    }

    if (!challengeFound) {
      return;
    }

    if (
      section === "legendaryActions" &&
      /^The .+ can take \d+ legendary actions/i.test(text)
    ) {
      notes.push(text);
      return;
    }

    addDocumentEntryToSection(text, {
      actions,
      bonusActions,
      lairActions,
      legendaryActions,
      reactions,
      section,
      traits,
    });
  });

  if (!record.armor_class || !record.hit_points || !record.challenge) {
    return null;
  }

  record.traits = traits;
  record.actions = actions;
  record.bonus_actions = bonusActions;
  record.reactions = reactions;
  record.legendary_actions = legendaryActions;
  record.lair_actions = lairActions;
  record.notes = notes.join("\n");

  return record;
}

function addDocumentEntryToSection(
  text: string,
  context: {
    actions: StatBlockAction[];
    bonusActions: StatBlockAction[];
    lairActions: StatBlockAction[];
    legendaryActions: StatBlockAction[];
    reactions: StatBlockAction[];
    section:
      | "traits"
      | "actions"
      | "bonusActions"
      | "reactions"
      | "legendaryActions"
      | "lairActions";
    traits: StatBlockAction[];
  },
) {
  const targets = {
    actions: context.actions,
    bonusActions: context.bonusActions,
    lairActions: context.lairActions,
    legendaryActions: context.legendaryActions,
    reactions: context.reactions,
    traits: context.traits,
  };
  const target = targets[context.section];
  const match = text.match(/^(.{2,90}?)(?:\.|:)\s+(.+)$/);

  if (match) {
    target.push({
      description: match[2].trim(),
      name: match[1].trim(),
    });
    return;
  }

  const last = target[target.length - 1];

  if (last) {
    last.description = `${last.description} ${text}`.trim();
  } else {
    target.push({ description: text, name: "Imported Entry" });
  }
}

function extractAbilityScoresFromDocumentTable(block: unknown) {
  if (!isPlainObject(block) || !Array.isArray(block.rows)) {
    return [];
  }

  const rows = block.rows as unknown[][];
  const scoreRow = rows.find((row) => {
    const values = row.map(readDocumentTableCellText);
    return values.filter((value) => /^\d+\s*\(/.test(value)).length >= 6;
  });

  if (!scoreRow) {
    return [];
  }

  return scoreRow
    .map(readDocumentTableCellText)
    .map((value) => safeNumber(value.match(/\d+/)?.[0]))
    .filter((score): score is number => score !== null)
    .slice(0, 6);
}

function createSrdDiagnostics(parsed: unknown): SrdImportDiagnostics {
  const rootType = Array.isArray(parsed)
    ? "array"
    : isPlainObject(parsed)
      ? "object"
      : "other";
  const candidateCollections = findMonsterCollections(parsed);

  return {
    candidateCollections,
    chosenPath: candidateCollections[0]?.path,
    rootType,
    sampleRecordKeys: candidateCollections[0]?.sampleKeys ?? [],
    topLevelKeys: isPlainObject(parsed) ? Object.keys(parsed).slice(0, 30) : [],
    totalCandidateRecords: candidateCollections[0]?.monsterLikeCount ?? 0,
  };
}

export function findMonsterCollections(parsed: unknown): SrdCollectionDiagnostic[] {
  const candidates: SrdCollectionDiagnostic[] = [];

  collectMonsterCollections(parsed, "$", 0, candidates);

  return candidates
    .filter((candidate) => candidate.monsterLikeCount > 0)
    .sort((a, b) => b.score - a.score);
}

function collectMonsterCollections(
  value: unknown,
  path: string,
  depth: number,
  candidates: SrdCollectionDiagnostic[],
) {
  if (depth > 8) {
    return;
  }

  if (Array.isArray(value)) {
    const plainRecords = value.filter(isPlainObject);
    const monsterRecords = value.filter(isMonsterLikeRecord);
    const monsterLikeCount = monsterRecords.length;

    if (plainRecords.length) {
      candidates.push({
        monsterLikeCount,
        path,
        recordCount: plainRecords.length,
        sampleKeys: sampleRecordKeys(plainRecords as TabyltopSrdMonster[]),
        score: monsterLikeCount * 10 - Math.max(0, plainRecords.length - monsterLikeCount),
      });
    }

    value.forEach((item, index) => {
      if (Array.isArray(item) || isPlainObject(item)) {
        collectMonsterCollections(item, `${path}[${index}]`, depth + 1, candidates);
      }
    });
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  Object.entries(value).forEach(([key, child]) => {
    if (Array.isArray(child) || isPlainObject(child)) {
      collectMonsterCollections(child, `${path}.${key}`, depth + 1, candidates);
    }
  });
}

function readPath(parsed: unknown, path: string): unknown[] {
  if (path === "$") {
    return Array.isArray(parsed) ? parsed : [];
  }

  const parts = path
    .replace(/^\$\./, "")
    .split(".")
    .filter(Boolean);
  let current: unknown = parsed;

  for (const part of parts) {
    if (!isPlainObject(current)) {
      return [];
    }

    current = current[part];
  }

  return Array.isArray(current) ? current : [];
}

function sampleRecordKeys(records: TabyltopSrdMonster[]) {
  return records.slice(0, 3).map((record) => Object.keys(record).slice(0, 20));
}

function readDocumentTableCellText(cell: unknown) {
  if (!isPlainObject(cell) || !Array.isArray(cell.subelements)) {
    return "";
  }

  return cell.subelements
    .map((subelement) =>
      isPlainObject(subelement) && typeof subelement.text === "string"
        ? subelement.text
        : "",
    )
    .join(" ")
    .trim();
}

function readDocumentBlockType(block: unknown) {
  return isPlainObject(block) && typeof block.type === "string" ? block.type : "";
}

function readDocumentBlockText(block: unknown) {
  if (!isPlainObject(block)) {
    return "";
  }

  if (typeof block.text === "string") {
    return block.text.trim();
  }

  if (typeof block.Description === "string") {
    return block.Description.trim();
  }

  if (!Array.isArray(block.subelements)) {
    return "";
  }

  return block.subelements
    .map((subelement) =>
      isPlainObject(subelement) && typeof subelement.text === "string"
        ? subelement.text
        : "",
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function isDocumentMonsterSectionHeading(text: string) {
  return /^(Actions|Bonus Actions|Reactions|Legendary Actions|Lair Actions)$/i.test(
    text,
  );
}

function findNestedMonsterRecords(parsed: TabyltopSrdMonster): SrdDatasetParseResult {
  const diagnostics = createSrdDiagnostics(parsed);
  const candidates: Array<{ records: TabyltopSrdMonster[]; shape: string }> = [];

  collectMonsterRecordCandidates(parsed, "$", 0, candidates);

  const best = candidates.sort((a, b) => b.records.length - a.records.length)[0];

  return best
    ? {
        diagnostics: {
          ...diagnostics,
          chosenPath: best.shape,
          sampleRecordKeys: sampleRecordKeys(best.records),
          totalCandidateRecords: best.records.length,
        },
        ...best,
      }
    : { diagnostics, records: [], shape: "nested" };
}

function collectMonsterRecordCandidates(
  value: unknown,
  path: string,
  depth: number,
  candidates: Array<{ records: TabyltopSrdMonster[]; shape: string }>,
) {
  if (depth > 8) {
    return;
  }

  if (Array.isArray(value)) {
    const records = value.filter(isMonsterLikeRecord);

    if (records.length) {
      candidates.push({ records, shape: path });
    }

    value.forEach((item, index) => {
      if (isPlainObject(item) || Array.isArray(item)) {
        collectMonsterRecordCandidates(item, `${path}[${index}]`, depth + 1, candidates);
      }
    });
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  Object.entries(value).forEach(([key, child]) => {
    if (isPlainObject(child) || Array.isArray(child)) {
      collectMonsterRecordCandidates(child, `${path}.${key}`, depth + 1, candidates);
    }
  });
}

function isMonsterLikeRecord(value: unknown): value is TabyltopSrdMonster {
  if (!isPlainObject(value)) {
    return false;
  }

  const name = readString(value, ["name", "Name"]);
  const armor = readString(value, [
    "armor_class",
    "armorClass",
    "Armor Class",
    "ac",
    "AC",
  ]);
  const hp = readString(value, [
    "hit_points",
    "hitPoints",
    "Hit Points",
    "hp",
    "HP",
  ]);
  const challenge = readString(value, [
    "challenge",
    "challenge_rating",
    "Challenge",
    "CR",
    "cr",
  ]);
  const speed = readString(value, ["speed", "Speed"]);
  const meta = readString(value, ["meta", "Meta", "size_type_alignment"]);
  const actions = value.actions ?? value.Actions;

  return Boolean(
    name &&
      ((armor && hp) || (challenge && speed)) &&
      (meta || actions || value.stats || value.str !== undefined || value.STR !== undefined),
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
