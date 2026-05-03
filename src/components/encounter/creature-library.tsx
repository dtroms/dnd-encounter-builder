"use client";

import { useMemo, useState } from "react";
import {
  libraryCreatures,
  type LibraryCreature,
  type LibrarySourceType,
} from "@/lib/encounter/library-sample-data";
import type {
  AbilityScores,
  CombatantType,
  StatBlockAction,
  StatBlockTrait,
} from "@/lib/encounter/types";
import { TypeBadge } from "./type-badge";

type RoleFilter = "all" | CombatantType | "npc";
type SourceFilter = "all" | LibrarySourceType;
type CrFilter = "all" | "0" | "eighth-quarter" | "half-one" | "two-four" | "five-plus";

const roleFilterOptions: Array<{ label: string; value: RoleFilter }> = [
  { label: "All", value: "all" },
  { label: "PC", value: "pc" },
  { label: "Enemy", value: "enemy" },
  { label: "Boss", value: "boss" },
  { label: "NPC", value: "npc" },
  { label: "Ally", value: "ally" },
  { label: "Summon", value: "summon" },
  { label: "Neutral", value: "neutral" },
];

const sourceLabels: Record<LibrarySourceType, string> = {
  custom: "Custom",
  imported: "Imported",
  sample: "Sample",
  srd: "SRD / Creative Commons",
};

const sourceFilterOptions: Array<{ label: string; value: SourceFilter }> = [
  { label: "All Sources", value: "all" },
  { label: "Sample", value: "sample" },
  { label: "Custom", value: "custom" },
  { label: "Imported", value: "imported" },
  { label: "SRD / Creative Commons", value: "srd" },
];

const crFilterOptions: Array<{ label: string; value: CrFilter }> = [
  { label: "Any CR", value: "all" },
  { label: "0", value: "0" },
  { label: "1/8-1/4", value: "eighth-quarter" },
  { label: "1/2-1", value: "half-one" },
  { label: "2-4", value: "two-four" },
  { label: "5+", value: "five-plus" },
];

const sizeOptions = [
  "Any",
  "Tiny",
  "Small",
  "Medium",
  "Large",
  "Huge",
  "Gargantuan",
];

export function CreatureLibrary({
  onOpenBuilder,
  onOpenImporter,
}: {
  onOpenBuilder: () => void;
  onOpenImporter: () => void;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [crFilter, setCrFilter] = useState<CrFilter>("all");
  const [sizeFilter, setSizeFilter] = useState("Any");
  const [selectedCreatureId, setSelectedCreatureId] = useState(
    libraryCreatures[0]?.id ?? "",
  );

  const filteredCreatures = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return libraryCreatures.filter((creature) => {
      const actionText = [
        ...creature.actions,
        ...(creature.bonusActions ?? []),
        ...(creature.reactions ?? []),
        ...(creature.legendaryActions ?? []),
        ...(creature.lairActions ?? []),
      ].map((action) => `${action.name} ${action.description}`);
      const searchable = [
        creature.name,
        creature.type,
        creature.size,
        creature.challengeRating ?? "",
        creature.notes ?? "",
        ...creature.tags,
        ...creature.traits.map((trait) => `${trait.name} ${trait.description}`),
        ...actionText,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalized.length === 0 || searchable.includes(normalized);
      const matchesRole =
        roleFilter === "all" ||
        creature.type === roleFilter ||
        (roleFilter === "npc" && creature.tags.includes("npc"));
      const matchesSource =
        sourceFilter === "all" || creature.sourceType === sourceFilter;
      const matchesSize = sizeFilter === "Any" || creature.size === sizeFilter;
      const matchesCr = matchesChallengeFilter(creature.challengeRating, crFilter);

      return matchesQuery && matchesRole && matchesSource && matchesSize && matchesCr;
    });
  }, [crFilter, query, roleFilter, sizeFilter, sourceFilter]);

  const selectedCreature =
    filteredCreatures.find((creature) => creature.id === selectedCreatureId) ??
    filteredCreatures[0] ??
    null;

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">Creature Library</h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-400">
              Manage saved creatures, custom monsters, and imported stat blocks.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="cursor-not-allowed rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-500"
              disabled
              type="button"
            >
              Create Creature later
            </button>
            <button
              className="rounded-lg border border-cyan-300/50 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:border-cyan-200 hover:text-white"
              type="button"
              onClick={onOpenImporter}
            >
              Import Stat Block
            </button>
          <button
            className="cursor-not-allowed rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-500"
            disabled
            type="button"
          >
            Import SRD Monsters
          </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.4fr)_minmax(0,0.6fr)]">
        <aside className="rounded-xl border border-slate-800 bg-slate-950/65 p-3">
          <LibraryFilters
            crFilter={crFilter}
            query={query}
            roleFilter={roleFilter}
            sizeFilter={sizeFilter}
            sourceFilter={sourceFilter}
            onCrFilterChange={setCrFilter}
            onQueryChange={setQuery}
            onReset={() => {
              setQuery("");
              setRoleFilter("all");
              setSourceFilter("all");
              setCrFilter("all");
              setSizeFilter("Any");
            }}
            onRoleFilterChange={setRoleFilter}
            onSizeFilterChange={setSizeFilter}
            onSourceFilterChange={setSourceFilter}
          />

          <div className="mt-3 flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-base font-black text-white">Creatures</h3>
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-black text-slate-400">
              {filteredCreatures.length} shown
            </span>
          </div>

          <div className="mt-2 grid gap-2">
            {filteredCreatures.map((creature) => (
              <CreatureListItem
                creature={creature}
                isSelected={creature.id === selectedCreature?.id}
                key={creature.id}
                onSelect={() => setSelectedCreatureId(creature.id)}
              />
            ))}
          </div>

          {filteredCreatures.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center">
              <p className="text-sm font-black text-slate-200">
                No creatures found
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                Clear filters or use future create/import actions.
              </p>
            </div>
          ) : null}
        </aside>

        {selectedCreature ? (
          <CreatureDetailPanel
            creature={selectedCreature}
            onOpenBuilder={onOpenBuilder}
          />
        ) : (
          <section className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center">
            <p className="text-lg font-black text-white">Select a creature</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Creature details will appear here.
            </p>
          </section>
        )}
      </div>
    </section>
  );
}

function LibraryFilters({
  crFilter,
  query,
  roleFilter,
  sizeFilter,
  sourceFilter,
  onCrFilterChange,
  onQueryChange,
  onReset,
  onRoleFilterChange,
  onSizeFilterChange,
  onSourceFilterChange,
}: {
  crFilter: CrFilter;
  query: string;
  roleFilter: RoleFilter;
  sizeFilter: string;
  sourceFilter: SourceFilter;
  onCrFilterChange: (value: CrFilter) => void;
  onQueryChange: (value: string) => void;
  onReset: () => void;
  onRoleFilterChange: (value: RoleFilter) => void;
  onSizeFilterChange: (value: string) => void;
  onSourceFilterChange: (value: SourceFilter) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/55 p-3">
      <input
        aria-label="Search creature library"
        className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
        placeholder="Search name, tag, action, trait..."
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select
          aria-label="Role filter"
          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-semibold text-white outline-none focus:border-cyan-300"
          value={roleFilter}
          onChange={(event) => onRoleFilterChange(event.target.value as RoleFilter)}
        >
          {roleFilterOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Source filter"
          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-semibold text-white outline-none focus:border-cyan-300"
          value={sourceFilter}
          onChange={(event) =>
            onSourceFilterChange(event.target.value as SourceFilter)
          }
        >
          {sourceFilterOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Challenge rating filter"
          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-semibold text-white outline-none focus:border-cyan-300"
          value={crFilter}
          onChange={(event) => onCrFilterChange(event.target.value as CrFilter)}
        >
          {crFilterOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Size filter"
          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-semibold text-white outline-none focus:border-cyan-300"
          value={sizeFilter}
          onChange={(event) => onSizeFilterChange(event.target.value)}
        >
          {sizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <button
        className="mt-3 h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs font-black text-slate-300 transition hover:border-cyan-300/60 hover:text-white"
        type="button"
        onClick={onReset}
      >
        Clear Filters
      </button>
    </div>
  );
}

function CreatureListItem({
  creature,
  isSelected,
  onSelect,
}: {
  creature: LibraryCreature;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`rounded-lg border p-3 text-left transition ${
        isSelected
          ? "border-cyan-300/70 bg-cyan-300/10 ring-2 ring-cyan-300/20"
          : "border-slate-800 bg-slate-900/55 hover:border-slate-600 hover:bg-slate-900/80"
      }`}
      type="button"
      onClick={onSelect}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TypeBadge type={creature.type} />
        <SourceBadge sourceType={creature.sourceType} />
      </div>
      <h4 className="mt-2 line-clamp-1 text-base font-black text-white">
        {creature.name}
      </h4>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
        <span>CR {creature.challengeRating ?? "-"}</span>
        <span>AC {creature.armorClass}</span>
        <span>HP {creature.maxHp}</span>
        <span>{creature.size}</span>
      </div>
      <p className="mt-2 line-clamp-1 text-xs font-semibold text-slate-500">
        {creature.tags.slice(0, 4).join(", ")}
      </p>
    </button>
  );
}

function CreatureDetailPanel({
  creature,
  onOpenBuilder,
}: {
  creature: LibraryCreature;
  onOpenBuilder: () => void;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/75 p-4 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={creature.type} />
            <SourceBadge sourceType={creature.sourceType} />
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-black text-slate-300">
              CR {creature.challengeRating ?? "-"}
            </span>
          </div>
          <h3 className="mt-3 text-3xl font-black leading-tight text-white">
            {creature.name}
          </h3>
          <p className="mt-2 text-sm font-bold text-slate-500">
            {creature.size} - {creature.sourceName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-cyan-300/50 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:border-cyan-200 hover:text-white"
            type="button"
            onClick={onOpenBuilder}
          >
            Add to Builder
          </button>
          <button
            className="cursor-not-allowed rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-500"
            disabled
            type="button"
          >
            Edit later
          </button>
          <button
            className="cursor-not-allowed rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-500"
            disabled
            type="button"
          >
            Duplicate later
          </button>
          <button
            className="cursor-not-allowed rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-500"
            disabled
            type="button"
          >
            Delete/Archive later
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <DetailStat label="AC" value={String(creature.armorClass)} />
        <DetailStat label="HP" value={String(creature.maxHp)} />
        <DetailStat label="Speed" value={creature.speed} />
        <DetailStat label="Init" value={formatModifier(creature.initiativeBonus)} />
      </div>

      <AbilityScoreGrid scores={creature.abilityScores} />

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <InfoBlock label="Senses" value={creature.senses} />
        <InfoBlock label="Languages" value={creature.languages} />
      </div>

      <StatSection items={creature.traits} title="Traits" />
      <StatSection items={creature.actions} title="Actions" />
      <StatSection items={creature.bonusActions} title="Bonus Actions" />
      <StatSection items={creature.reactions} title="Reactions" />
      <StatSection items={creature.legendaryActions} title="Legendary Actions" />
      <StatSection items={creature.lairActions} title="Lair Actions" />

      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/55 p-4">
        <h4 className="text-sm font-black text-white">Notes</h4>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
          {creature.notes ?? "No notes yet."}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {creature.tags.map((tag) => (
            <span
              className="rounded-md bg-slate-950 px-2 py-1 text-xs font-bold text-slate-400"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <SourceMetadata creature={creature} />
    </section>
  );
}

function SourceMetadata({ creature }: { creature: LibraryCreature }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/45 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-black text-white">Source / Import Metadata</h4>
        <SourceBadge sourceType={creature.sourceType} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <MetadataFact label="Source" value={creature.sourceName} />
        <MetadataFact label="License" value={creature.licenseName} />
        <MetadataFact
          label="Import Method"
          value={creature.importMethod ?? "Not imported"}
        />
        <MetadataFact label="Source URL" value={creature.sourceUrl ?? "None"} />
      </div>
      {creature.attribution ? (
        <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
          {creature.attribution}
        </p>
      ) : null}
    </div>
  );
}

function SourceBadge({ sourceType }: { sourceType: LibrarySourceType }) {
  const styles: Record<LibrarySourceType, string> = {
    custom: "border-purple-400/35 bg-purple-500/10 text-purple-100",
    imported: "border-cyan-300/35 bg-cyan-300/10 text-cyan-100",
    sample: "border-slate-600 bg-slate-900 text-slate-300",
    srd: "border-emerald-400/35 bg-emerald-500/10 text-emerald-100",
  };

  return (
    <span
      className={`rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${styles[sourceType]}`}
    >
      {sourceLabels[sourceType]}
    </span>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function AbilityScoreGrid({ scores }: { scores: AbilityScores }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
      {Object.entries(scores).map(([ability, value]) => (
        <div
          className="rounded-lg border border-slate-800 bg-slate-900/55 px-2 py-2 text-center"
          key={ability}
        >
          <p className="text-[10px] font-black uppercase text-slate-500">
            {ability}
          </p>
          <p className="text-base font-black text-slate-100">{value}</p>
        </div>
      ))}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/45 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-300">
        {value}
      </p>
    </div>
  );
}

function StatSection({
  items,
  title,
}: {
  items?: Array<StatBlockTrait | StatBlockAction>;
  title: string;
}) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="mt-5">
      <h4 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
        {title}
      </h4>
      <div className="mt-2 grid gap-2">
        {items.map((item) => (
          <div
            className="rounded-lg border border-slate-800 bg-slate-900/55 p-3"
            key={`${title}-${item.name}`}
          >
            <p className="text-sm font-black text-slate-100">{item.name}</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetadataFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold text-slate-300">{value}</p>
    </div>
  );
}

function matchesChallengeFilter(value: string | undefined, filter: CrFilter) {
  if (filter === "all") {
    return true;
  }

  const cr = parseChallengeRating(value);

  if (filter === "0") {
    return cr === 0 || cr === null;
  }

  if (cr === null) {
    return false;
  }

  if (filter === "eighth-quarter") {
    return cr >= 0.125 && cr <= 0.25;
  }

  if (filter === "half-one") {
    return cr >= 0.5 && cr <= 1;
  }

  if (filter === "two-four") {
    return cr >= 2 && cr <= 4;
  }

  return cr >= 5;
}

function parseChallengeRating(value?: string) {
  if (!value) {
    return null;
  }

  if (value.includes("/")) {
    const [numerator, denominator] = value.split("/").map(Number);
    return denominator ? numerator / denominator : null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatModifier(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`;
}
