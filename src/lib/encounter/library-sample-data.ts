import { sampleCreatureTemplates } from "./sample-data";
import type { CreatureTemplate, MonsterType } from "./types";

export type LibrarySourceType = "sample" | "custom" | "imported" | "srd";

export type LibraryCreature = CreatureTemplate & {
  importMethod?: string;
  importNotes?: string;
  importedAt?: string;
  licenseName: string;
  parserConfidence?: number;
  parserVersion?: string;
  sourceName: string;
  sourceDocumentVersion?: string;
  sourceRawUrl?: string;
  sourceType: LibrarySourceType;
  sourceUrl?: string;
  attribution?: string;
};

const monsterTypeOverrides: Record<string, MonsterType> = {
  "boss-velkora": "Humanoid",
  "goblin-bristle": "Humanoid",
  "goblin-cinder": "Humanoid",
  "goblin-murk": "Humanoid",
  "goblin-rattle": "Humanoid",
  "neutral-sable": "Humanoid",
  "pc-aria": "Humanoid",
  "pc-mira": "Humanoid",
  "pc-tovin": "Humanoid",
  "shadow-hound": "Monstrosity",
};

const sourceOverrides: Record<
  string,
  Partial<
    Pick<
      LibraryCreature,
      | "attribution"
      | "importMethod"
      | "licenseName"
      | "sourceName"
      | "sourceType"
      | "sourceUrl"
    >
  >
> = {
  "boss-velkora": {
    sourceName: "Original Sample Boss",
    sourceType: "custom",
  },
  "neutral-sable": {
    importMethod: "paste review placeholder",
    sourceName: "User Import Draft Example",
    sourceType: "imported",
  },
  "shadow-hound": {
    attribution: "Future SRD attribution will be shown here when imported.",
    licenseName: "CC-BY-4.0",
    sourceName: "SRD / Creative Commons Placeholder",
    sourceType: "srd",
    sourceUrl: "https://github.com/Tabyltop/CC-SRD",
  },
};

export const libraryCreatures: LibraryCreature[] = sampleCreatureTemplates.map(
  (template) => ({
    ...template,
    licenseName: "none/custom",
    monsterType: monsterTypeOverrides[template.id] ?? "Custom / Other",
    sourceName: "Original Sample Content",
    sourceType: "sample",
    ...sourceOverrides[template.id],
  }),
);
