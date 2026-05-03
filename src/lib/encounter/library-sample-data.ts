import { sampleCreatureTemplates } from "./sample-data";
import type { CreatureTemplate } from "./types";

export type LibrarySourceType = "sample" | "custom" | "imported" | "srd";

export type LibraryCreature = CreatureTemplate & {
  importMethod?: string;
  licenseName: string;
  sourceName: string;
  sourceType: LibrarySourceType;
  sourceUrl?: string;
  attribution?: string;
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
    sourceName: "Original Sample Content",
    sourceType: "sample",
    ...sourceOverrides[template.id],
  }),
);
