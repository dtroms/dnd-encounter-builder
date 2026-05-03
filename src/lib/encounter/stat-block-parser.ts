import type {
  AbilityScores,
  CombatantType,
  MonsterType,
  StatBlockAction,
  StatBlockTrait,
} from "./types";

export type ParserConfidence = "low" | "medium" | "high";

export type ParsedCreatureDraft = {
  abilityScores: AbilityScores;
  actions: StatBlockAction[];
  alignment?: string;
  armorClass: number | null;
  armorClassNote?: string;
  bonusActions: StatBlockAction[];
  challengeRating: string;
  challengeXp?: string;
  conditionImmunities: string[];
  damageImmunities: string[];
  damageResistances: string[];
  damageVulnerabilities: string[];
  hitPointFormula?: string;
  initiativeBonus: number | null;
  languages: string;
  lairActions: StatBlockAction[];
  legendaryActions: StatBlockAction[];
  maxHp: number | null;
  monsterSubtype?: string;
  monsterType: MonsterType;
  name: string;
  notes: string;
  rawImportText: string;
  normalizedRawText: string;
  reactions: StatBlockAction[];
  savingThrows: string[];
  senses: string;
  size: string;
  skills: string[];
  speed: string;
  tags: string[];
  traits: StatBlockTrait[];
  type: CombatantType;
};

export type StatBlockParseResult = {
  confidence: ParserConfidence;
  draft: ParsedCreatureDraft;
  extraSections: Array<{ heading: string; text: string }>;
  lowConfidenceFields: string[];
  missingRequiredFields: string[];
  normalizedRawText: string;
  originalRawText: string;
  warnings: string[];
};

type SectionMap = Map<string, string[]>;

const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;
const abilityAliases: Record<(typeof abilityKeys)[number], string[]> = {
  cha: ["cha", "charisma"],
  con: ["con", "constitution"],
  dex: ["dex", "dexterity"],
  int: ["int", "intelligence"],
  str: ["str", "strength"],
  wis: ["wis", "wisdom"],
};
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
const knownHeadings = [
  "actions",
  "bonus actions",
  "reactions",
  "legendary actions",
  "lair actions",
  "mythic actions",
  "villain actions",
  "regional effects",
  "environmental effects",
  "special equipment",
];
const metadataLabels = [
  "armor class",
  "ac",
  "hit points",
  "hp",
  "speed",
  "saving throws",
  "skills",
  "damage vulnerabilities",
  "damage resistances",
  "damage immunities",
  "condition immunities",
  "senses",
  "languages",
  "challenge",
  "challenge rating",
  "cr",
];

export function parseStatBlock(rawText: string): StatBlockParseResult {
  const normalizedRawText = normalizeStatBlockText(rawText);
  const lines = normalizedRawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const warnings: string[] = [];
  const lowConfidenceFields: string[] = [];
  const name = parseName(lines);
  const identity = parseIdentityLine(lines);
  const armor = parseArmorClass(normalizedRawText);
  const hp = parseHitPoints(normalizedRawText);
  const challenge = parseChallenge(normalizedRawText);
  const abilityResult = parseAbilityScores(normalizedRawText);
  const sections = splitSections(lines);
  const traits = parseTraits(lines, sections);
  const actions = parseEntries(sections.get("actions") ?? []);
  const bonusActions = parseEntries(sections.get("bonus actions") ?? []);
  const reactions = parseEntries(sections.get("reactions") ?? []);
  const legendaryActions = parseEntries(
    stripLegendaryIntro(sections.get("legendary actions") ?? []),
  );
  const lairActions = parseEntries(sections.get("lair actions") ?? [], {
    fallbackPrefix: "Lair Action",
  });
  const extraSections = collectExtraSections(sections);
  const speed = parseLineValue(normalizedRawText, ["Speed"]);
  const savingThrows = splitList(
    parseLineValue(normalizedRawText, ["Saving Throws"]),
  );
  const skills = splitList(parseLineValue(normalizedRawText, ["Skills"]));
  const senses = parseLineValue(normalizedRawText, ["Senses"]);
  const languages = parseLineValue(normalizedRawText, ["Languages"]);
  const damageVulnerabilities = splitList(
    parseLineValue(normalizedRawText, ["Damage Vulnerabilities"]),
  );
  const damageResistances = splitList(
    parseLineValue(normalizedRawText, ["Damage Resistances"]),
  );
  const damageImmunities = splitList(
    parseLineValue(normalizedRawText, ["Damage Immunities"]),
  );
  const conditionImmunities = splitList(
    parseLineValue(normalizedRawText, ["Condition Immunities"]),
  );
  const initiativeBonus =
    parseSignedLineValue(normalizedRawText, ["Initiative", "Init"]) ??
    abilityModifier(abilityResult.scores.dex);

  if (!name) {
    warnings.push("Missing or unrecognized creature name.");
  }

  if (armor.value === null) {
    warnings.push("Missing or unrecognized Armor Class.");
  }

  if (hp.value === null) {
    warnings.push("Missing or unrecognized Hit Points.");
  }

  if (!speed) {
    warnings.push("Missing or unrecognized speed.");
    lowConfidenceFields.push("speed");
  }

  if (!challenge.value) {
    warnings.push("Missing or unrecognized challenge rating.");
  }

  if (!abilityResult.detected) {
    warnings.push("Ability scores were not detected. Review the default scores.");
    lowConfidenceFields.push("ability scores");
  }

  if (!identity.monsterType || identity.monsterType === "Unknown / Unset") {
    warnings.push("Creature type was not detected. Review the type before saving.");
  }

  if (!actions.length) {
    warnings.push("No actions were detected. Add or review actions before saving.");
  }

  if (extraSections.length) {
    warnings.push("Extra sections were preserved in notes for review.");
  }

  const missingRequiredFields = [
    !name ? "name" : null,
    armor.value === null ? "armor class" : null,
    hp.value === null ? "hit points" : null,
    !speed ? "speed" : null,
    !challenge.value ? "challenge rating" : null,
    !identity.monsterType || identity.monsterType === "Unknown / Unset"
      ? "creature type"
      : null,
    !abilityResult.detected ? "ability scores" : null,
  ].filter(Boolean) as string[];

  const detectedFields = [
    name,
    armor.value,
    hp.value,
    speed,
    challenge.value,
    abilityResult.detected,
    senses,
    languages,
    traits.length,
    actions.length,
    damageImmunities.length || conditionImmunities.length,
  ].filter(Boolean).length;

  const confidence: ParserConfidence =
    missingRequiredFields.length >= 3
      ? "low"
      : detectedFields >= 8 && warnings.length <= 2
        ? "high"
        : "medium";

  return {
    confidence,
    draft: {
      abilityScores: abilityResult.scores,
      actions,
      alignment: identity.alignment,
      armorClass: armor.value,
      armorClassNote: armor.note,
      bonusActions,
      challengeRating: challenge.value,
      challengeXp: challenge.xp,
      conditionImmunities,
      damageImmunities,
      damageResistances,
      damageVulnerabilities,
      hitPointFormula: hp.formula,
      initiativeBonus,
      languages: languages || "None",
      lairActions,
      legendaryActions,
      maxHp: hp.value,
      monsterSubtype: identity.subtype,
      monsterType: identity.monsterType,
      name,
      normalizedRawText,
      notes: buildNotes({
        armorNote: armor.note,
        challengeXp: challenge.xp,
        extraSections,
        identityLine: identity.rawLine,
        rawText,
      }),
      rawImportText: rawText,
      reactions,
      savingThrows,
      senses: senses || "passive Perception 10",
      size: identity.size,
      skills,
      speed,
      tags: ["imported", "paste-review"],
      traits,
      type: identity.role,
    },
    extraSections,
    lowConfidenceFields,
    missingRequiredFields,
    normalizedRawText,
    originalRawText: rawText,
    warnings,
  };
}

export function normalizeStatBlockText(rawText: string) {
  return rawText
    .replace(/\r\n?/g, "\n")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/½/g, "1/2")
    .replace(/¼/g, "1/4")
    .replace(/⅛/g, "1/8")
    .replace(/¾/g, "3/4")
    .replace(/•/g, "-")
    .replace(/\t/g, " ")
    .split("\n")
    .map((line) => line.replace(/[ ]{2,}/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseName(lines: string[]) {
  return (
    lines.find(
      (line) =>
        !isMetadataLine(line) &&
        !isHeading(line) &&
        !isAbilityHeader(line) &&
        !isAbilityValuesLine(line),
    ) ?? ""
  );
}

function parseIdentityLine(lines: string[]) {
  const identityLine = lines.find(
    (line, index) =>
      index > 0 &&
      /^(Tiny|Small|Medium|Large|Huge|Gargantuan)\b/i.test(line),
  );
  const size =
    identityLine?.match(/\b(Tiny|Small|Medium|Large|Huge|Gargantuan)\b/i)?.[1] ??
    "Medium";
  const typeMatch = identityLine?.match(
    /^(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+([A-Za-z ]+?)(?:\s*\(([^)]+)\))?(?:,\s*(.+))?$/i,
  );
  const typeText = typeMatch?.[2]?.trim() ?? "";
  const monsterType =
    monsterTypes.find(
      (type) =>
        type !== "Custom / Other" &&
        type !== "Unknown / Unset" &&
        type.toLowerCase() === typeText.toLowerCase(),
    ) ?? "Unknown / Unset";
  const role: CombatantType = /boss|legendary|lair/i.test(lines.join("\n"))
    ? "boss"
    : "enemy";

  return {
    alignment: typeMatch?.[4]?.trim(),
    monsterType,
    rawLine: identityLine,
    role,
    size,
    subtype: typeMatch?.[3]?.trim(),
  };
}

function parseArmorClass(text: string) {
  const match = text.match(/^ *(?:Armor Class|AC) *:? *(\d+)(?: *\(([^)]*)\))?/im);

  return {
    note: match?.[2]?.trim() || undefined,
    value: match ? safeNumber(match[1]) : null,
  };
}

function parseHitPoints(text: string) {
  const match = text.match(/^ *(?:Hit Points|HP) *:? *(\d+)(?: *\(([^)]*)\))?/im);

  return {
    formula: match?.[2]?.trim() || undefined,
    value: match ? safeNumber(match[1]) : null,
  };
}

function parseChallenge(text: string) {
  const match = text.match(
    /^ *(?:Challenge Rating|Challenge|CR) *:? *([0-9]+(?:\/[0-9]+)?)(?: *\(([^)]*)\))?/im,
  );

  return {
    value: match?.[1]?.trim() ?? "",
    xp: match?.[2]?.trim(),
  };
}

function parseAbilityScores(text: string) {
  const defaults: AbilityScores = {
    cha: 10,
    con: 10,
    dex: 10,
    int: 10,
    str: 10,
    wis: 10,
  };
  const lines = text.split("\n").map((line) => line.trim());
  const headerIndex = lines.findIndex(isAbilityHeader);
  const inlineScores = parseInlineAbilityScores(text);

  if (inlineScores) {
    return { detected: true, scores: inlineScores };
  }

  if (headerIndex !== -1) {
    const valueLine = lines
      .slice(headerIndex + 1, headerIndex + 4)
      .find((line) => /\d/.test(line));
    const values = [...(valueLine?.matchAll(/(\d{1,2})\s*(?:\([+-]?\d+\))?/g) ?? [])]
      .map((match) => match[1])
      .slice(0, 6);

    if (values.length === 6) {
      return {
        detected: true,
        scores: abilityKeys.reduce(
          (scores, key, index) => ({
            ...scores,
            [key]: Number(values[index]),
          }),
          defaults,
        ),
      };
    }
  }

  return { detected: false, scores: defaults };
}

function parseInlineAbilityScores(text: string): AbilityScores | null {
  const found: Partial<AbilityScores> = {};

  abilityKeys.forEach((key) => {
    const aliases = abilityAliases[key].join("|");
    const match = text.match(new RegExp(`\\b(?:${aliases})\\b\\s*(\\d{1,2})`, "i"));

    if (match) {
      found[key] = Number(match[1]);
    }
  });

  return abilityKeys.every((key) => Number.isFinite(found[key]))
    ? (found as AbilityScores)
    : null;
}

function splitSections(lines: string[]): SectionMap {
  const sections: SectionMap = new Map();
  let current: string | null = null;

  lines.forEach((line) => {
    const heading = normalizeHeading(line);

    if (heading) {
      current = heading;
      sections.set(current, []);
      return;
    }

    if (current) {
      sections.get(current)?.push(line);
    }
  });

  return sections;
}

function parseTraits(lines: string[], sections: SectionMap): StatBlockTrait[] {
  const explicitTraits = parseEntries(sections.get("traits") ?? []);

  if (explicitTraits.length) {
    return explicitTraits;
  }

  const actionIndex = lines.findIndex((line) => normalizeHeading(line) === "actions");
  const metadataEnd = findMetadataEnd(lines);
  const traitLines = lines.slice(
    metadataEnd + 1,
    actionIndex === -1 ? undefined : actionIndex,
  );

  return parseEntries(
    traitLines.filter(
      (line) =>
        !isAbilityHeader(line) &&
        !isAbilityValuesLine(line) &&
        !isMetadataLine(line) &&
        !isHeading(line),
    ),
  );
}

function parseEntries(
  lines: string[],
  options: { fallbackPrefix?: string } = {},
): StatBlockAction[] {
  const entries: StatBlockAction[] = [];
  const fallbackPrefix = options.fallbackPrefix ?? "Imported Entry";

  lines.forEach((line) => {
    const bullet = line.match(/^[-*]\s*(.+)$/);
    const normalizedLine = bullet?.[1] ?? line;
    const named = normalizedLine.match(/^(.{2,80}?)(?:\.|:)\s+(.+)$/);

    if (named && looksLikeEntryName(named[1])) {
      entries.push({
        description: named[2].trim(),
        name: named[1].trim(),
      });
      return;
    }

    if (!entries.length || bullet) {
      entries.push({
        description: normalizedLine.trim(),
        name: bullet ? `${fallbackPrefix} ${entries.length + 1}` : fallbackPrefix,
      });
      return;
    }

    const previous = entries[entries.length - 1];
    previous.description = `${previous.description}\n${normalizedLine.trim()}`;
  });

  return entries.filter((entry) => entry.description.trim());
}

function stripLegendaryIntro(lines: string[]) {
  const firstNamedIndex = lines.findIndex((line) => {
    const match = line.match(/^(.{2,80}?)(?:\.|:)\s+(.+)$/);
    return Boolean(match && looksLikeEntryName(match[1]));
  });

  return firstNamedIndex === -1 ? lines : lines.slice(firstNamedIndex);
}

function collectExtraSections(sections: SectionMap) {
  return [...sections.entries()]
    .filter(([heading]) =>
      [
        "mythic actions",
        "villain actions",
        "regional effects",
        "environmental effects",
        "special equipment",
      ].includes(heading),
    )
    .map(([heading, lines]) => ({ heading, text: lines.join("\n") }));
}

function parseLineValue(text: string, labels: string[]) {
  const pattern = labels.map(escapeRegExp).join("|");
  const match = text.match(new RegExp(`^ *(?:${pattern}) *:? *(.+)$`, "im"));

  return match?.[1]?.trim() ?? "";
}

function parseSignedLineValue(text: string, labels: string[]) {
  const value = parseLineValue(text, labels);
  const match = value.match(/[+-]?\d+/);

  return match ? safeNumber(match[0]) : null;
}

function splitList(value?: string) {
  if (!value || /^none|-$/i.test(value)) {
    return [];
  }

  return value
    .replace(/\band\b/g, ",")
    .split(/,|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildNotes({
  armorNote,
  challengeXp,
  extraSections,
  identityLine,
  rawText,
}: {
  armorNote?: string;
  challengeXp?: string;
  extraSections: Array<{ heading: string; text: string }>;
  identityLine?: string;
  rawText: string;
}) {
  const notes = ["Imported from pasted stat block. Review before saving."];

  if (identityLine) {
    notes.push(`Identity line: ${identityLine}`);
  }

  if (armorNote) {
    notes.push(`Armor note: ${armorNote}`);
  }

  if (challengeXp) {
    notes.push(`Challenge XP: ${challengeXp}`);
  }

  extraSections.forEach((section) => {
    notes.push(`${titleCase(section.heading)}:\n${section.text}`);
  });

  if (rawText.trim()) {
    notes.push("Raw pasted text is held only in this local review draft.");
  }

  return notes.join("\n\n");
}

function findMetadataEnd(lines: string[]) {
  let end = 1;

  lines.forEach((line, index) => {
    if (
      index > end &&
      (isMetadataLine(line) || isAbilityHeader(line) || isAbilityValuesLine(line))
    ) {
      end = index;
    }
  });

  return end;
}

function isMetadataLine(line: string) {
  const lower = line.toLowerCase();
  return metadataLabels.some((label) => {
    const escaped = escapeRegExp(label);
    return new RegExp(`^${escaped}(?:\\b|\\s|:)`, "i").test(lower);
  });
}

function isAbilityHeader(line: string) {
  const normalized = line.toLowerCase().replace(/\s+/g, " ");

  return (
    /^str dex con int wis cha$/.test(normalized) ||
    /^strength dexterity constitution intelligence wisdom charisma$/.test(
      normalized,
    )
  );
}

function isAbilityValuesLine(line: string) {
  return /^(\d{1,2}\s*(?:\([+-]?\d+\))?\s*){6}$/.test(line);
}

function isHeading(line: string) {
  return Boolean(normalizeHeading(line));
}

function normalizeHeading(line: string) {
  const lower = line.toLowerCase().replace(/:$/, "");
  return knownHeadings.includes(lower) || lower === "traits" ? lower : null;
}

function looksLikeEntryName(value: string) {
  return !metadataLabels.some((label) => value.toLowerCase().startsWith(label));
}

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function safeNumber(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
