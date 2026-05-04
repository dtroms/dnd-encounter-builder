"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  AbilityScores,
  CombatantType,
  MonsterType,
  StatBlockAction,
  StatBlockTrait,
} from "@/lib/encounter/types";
import type {
  LibraryCreature,
  LibrarySourceType,
} from "@/lib/encounter/library-sample-data";
import {
  ExternalCharacterSheetViewer,
  getSafeExternalSheetUrl,
  getUrlHost,
} from "./external-character-sheet-viewer";
import { TypeBadge } from "./type-badge";

type RoleFilter = "all" | CombatantType | "npc";
type SourceFilter = "all" | LibrarySourceType;
type MonsterTypeFilter = "all" | MonsterType;
type CrFilter =
  | "all"
  | "0"
  | "eighth-quarter"
  | "half-one"
  | "two-four"
  | "five-plus";
type EditorMode = "create" | "edit";

const monsterTypeOptions: MonsterType[] = [
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

const roleFilterOptions: Array<{ label: string; value: RoleFilter }> = [
  { label: "All Roles", value: "all" },
  { label: "PC", value: "pc" },
  { label: "Enemy", value: "enemy" },
  { label: "Boss", value: "boss" },
  { label: "NPC", value: "npc" },
  { label: "Ally", value: "ally" },
  { label: "Summon", value: "summon" },
  { label: "Minion", value: "minion" },
  { label: "Neutral", value: "neutral" },
];

const combatRoleOptions: CombatantType[] = [
  "pc",
  "enemy",
  "boss",
  "ally",
  "summon",
  "minion",
  "neutral",
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

const emptyAction = { description: "", name: "" };

export function CreatureLibrary({
  creatures,
  errorMessage,
  isBusy = false,
  isLoading = false,
  onCreateCreature,
  onDuplicateCreature,
  onArchiveCreature,
  onOpenBuilder,
  onOpenImporter,
  onRetry,
  onUpdateCreature,
  useSupabaseData = false,
}: {
  creatures: LibraryCreature[];
  errorMessage?: string | null;
  isBusy?: boolean;
  isLoading?: boolean;
  onArchiveCreature: (creatureId: string) => Promise<boolean> | boolean | void;
  onCreateCreature: (
    creature: LibraryCreature,
  ) => Promise<LibraryCreature | null | void> | LibraryCreature | null | void;
  onDuplicateCreature: (
    creature: LibraryCreature,
  ) => Promise<LibraryCreature | null | void> | LibraryCreature | null | void;
  onOpenBuilder: () => void;
  onOpenImporter: () => void;
  onRetry?: () => void;
  onUpdateCreature: (
    creature: LibraryCreature,
  ) => Promise<LibraryCreature | null | void> | LibraryCreature | null | void;
  useSupabaseData?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [monsterTypeFilter, setMonsterTypeFilter] =
    useState<MonsterTypeFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [crFilter, setCrFilter] = useState<CrFilter>("all");
  const [sizeFilter, setSizeFilter] = useState("Any");
  const [selectedCreatureId, setSelectedCreatureId] = useState(
    creatures[0]?.id ?? "",
  );
  const [editorState, setEditorState] = useState<{
    creature: LibraryCreature;
    mode: EditorMode;
  } | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [sheetViewerCreature, setSheetViewerCreature] =
    useState<LibraryCreature | null>(null);

  const filteredCreatures = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return creatures.filter((creature) => {
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
        creature.monsterType ?? "",
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
      const matchesMonsterType =
        monsterTypeFilter === "all" || creature.monsterType === monsterTypeFilter;
      const matchesRole =
        roleFilter === "all" ||
        creature.type === roleFilter ||
        (roleFilter === "npc" && creature.tags.includes("npc"));
      const matchesSource =
        sourceFilter === "all" || creature.sourceType === sourceFilter;
      const matchesSize = sizeFilter === "Any" || creature.size === sizeFilter;
      const matchesCr = matchesChallengeFilter(creature.challengeRating, crFilter);

      return (
        matchesQuery &&
        matchesMonsterType &&
        matchesRole &&
        matchesSource &&
        matchesSize &&
        matchesCr
      );
    });
  }, [
    creatures,
    crFilter,
    monsterTypeFilter,
    query,
    roleFilter,
    sizeFilter,
    sourceFilter,
  ]);

  const selectedCreature =
    filteredCreatures.find((creature) => creature.id === selectedCreatureId) ??
    creatures.find((creature) => creature.id === selectedCreatureId) ??
    filteredCreatures[0] ??
    null;

  async function saveCreature(creature: LibraryCreature, mode: EditorMode) {
    const savedCreature =
      mode === "create"
        ? await onCreateCreature(creature)
        : await onUpdateCreature(creature);

    const creatureToSelect = savedCreature ?? creature;

    setSelectedCreatureId(creatureToSelect.id);
    setEditorState(null);
  }

  async function duplicateCreature(creature: LibraryCreature) {
    if (useSupabaseData) {
      const savedCopy = await onDuplicateCreature(creature);

      if (savedCopy) {
        setSelectedCreatureId(savedCopy.id);
      }

      return;
    }

    const copy: LibraryCreature = {
      ...cloneCreature(creature),
      id: `custom-${slugify(creature.name)}-${Date.now()}`,
      name: `${creature.name} Variant`,
      sourceName: "Duplicated Local Creature",
      sourceType: "custom",
      licenseName: "none/custom/private",
      attribution: creature.attribution
        ? `${creature.attribution} Duplicated locally for editing.`
        : undefined,
    };

    await onDuplicateCreature(copy);
    setSelectedCreatureId(copy.id);
  }

  async function archiveCreature(creature: LibraryCreature) {
    const remainingCreatures = creatures.filter((item) => item.id !== creature.id);
    const removed = await onArchiveCreature(creature.id);

    if (removed === false) {
      return;
    }

    setSelectedCreatureId(remainingCreatures[0]?.id ?? "");
    setConfirmArchiveId(null);
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">Creature Library</h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-400">
              {useSupabaseData
                ? "Signed-in creature templates are saved to Supabase. Builder still uses the shared in-session creature list for now."
                : "Manage saved creatures, custom monsters, and imported stat blocks."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200"
              disabled={isBusy}
              type="button"
              onClick={() =>
                setEditorState({
                  creature: createBlankCreature(),
                  mode: "create",
                })
              }
            >
              Create Creature
            </button>
            <button
              className="rounded-lg border border-cyan-300/50 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:border-cyan-200 hover:text-white"
              type="button"
              onClick={onOpenImporter}
            >
              Go to Importer
            </button>
          </div>
        </div>
      </div>

      {editorState ? (
        <CreatureEditor
          creature={editorState.creature}
          isSaving={isBusy}
          mode={editorState.mode}
          onCancel={() => setEditorState(null)}
          onSave={(creature) => saveCreature(creature, editorState.mode)}
        />
      ) : null}

      {errorMessage ? (
        <LibraryErrorState error={errorMessage} onRetry={onRetry} />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.4fr)_minmax(0,0.6fr)]">
        <aside className="rounded-xl border border-slate-800 bg-slate-950/65 p-3">
          <LibraryFilters
            crFilter={crFilter}
            monsterTypeFilter={monsterTypeFilter}
            query={query}
            roleFilter={roleFilter}
            sizeFilter={sizeFilter}
            sourceFilter={sourceFilter}
            onCrFilterChange={setCrFilter}
            onMonsterTypeFilterChange={setMonsterTypeFilter}
            onQueryChange={setQuery}
            onReset={() => {
              setQuery("");
              setMonsterTypeFilter("all");
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

          {isLoading ? (
            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/55 p-6 text-center">
              <p className="text-sm font-black text-slate-200">
                Loading creature library...
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                Pulling your creature templates from Supabase.
              </p>
            </div>
          ) : null}

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

          {!isLoading && filteredCreatures.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center">
              <p className="text-sm font-black text-slate-200">
                {creatures.length === 0
                  ? "No creatures in your library yet"
                  : "No creatures found"}
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                {creatures.length === 0
                  ? "Create your first creature or go to the Importer."
                  : "Try clearing filters or creating a new creature."}
              </p>
              {creatures.length === 0 ? (
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <button
                    className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200"
                    type="button"
                    onClick={() =>
                      setEditorState({
                        creature: createBlankCreature(),
                        mode: "create",
                      })
                    }
                  >
                    Create Creature
                  </button>
                  <button
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-300/60 hover:text-white"
                    type="button"
                    onClick={onOpenImporter}
                  >
                    Go to Importer
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>

        {selectedCreature ? (
          <CreatureDetailPanel
            creature={selectedCreature}
            onDuplicate={() => duplicateCreature(selectedCreature)}
            onEdit={() =>
              setEditorState({
                creature: cloneCreature(selectedCreature),
                mode: "edit",
              })
            }
            archiveConfirmOpen={confirmArchiveId === selectedCreature.id}
            isBusy={isBusy}
            onArchive={() => setConfirmArchiveId(selectedCreature.id)}
            onArchiveCancel={() => setConfirmArchiveId(null)}
            onArchiveConfirm={() => archiveCreature(selectedCreature)}
            onOpenBuilder={onOpenBuilder}
            onViewSheet={() => setSheetViewerCreature(selectedCreature)}
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

      {sheetViewerCreature?.characterSheetUrl ? (
        <ExternalCharacterSheetViewer
          title={
            sheetViewerCreature.characterSheetTitle?.trim() ||
            sheetViewerCreature.name
          }
          url={sheetViewerCreature.characterSheetUrl}
          onClose={() => setSheetViewerCreature(null)}
        />
      ) : null}
    </section>
  );
}

function LibraryFilters({
  crFilter,
  monsterTypeFilter,
  query,
  roleFilter,
  sizeFilter,
  sourceFilter,
  onCrFilterChange,
  onMonsterTypeFilterChange,
  onQueryChange,
  onReset,
  onRoleFilterChange,
  onSizeFilterChange,
  onSourceFilterChange,
}: {
  crFilter: CrFilter;
  monsterTypeFilter: MonsterTypeFilter;
  query: string;
  roleFilter: RoleFilter;
  sizeFilter: string;
  sourceFilter: SourceFilter;
  onCrFilterChange: (value: CrFilter) => void;
  onMonsterTypeFilterChange: (value: MonsterTypeFilter) => void;
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
          aria-label="Monster type filter"
          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-semibold text-white outline-none focus:border-cyan-300"
          value={monsterTypeFilter}
          onChange={(event) =>
            onMonsterTypeFilterChange(event.target.value as MonsterTypeFilter)
          }
        >
          <option value="all">All monster types</option>
          {monsterTypeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select
          aria-label="Combat role filter"
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
        {creature.characterSheetUrl ? (
          <span className="rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-100">
            Sheet
          </span>
        ) : null}
      </div>
      <h4 className="mt-2 line-clamp-1 text-base font-black text-white">
        {creature.name}
      </h4>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
        <span>{creature.monsterType ?? "Unknown / Unset"}</span>
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
  archiveConfirmOpen,
  isBusy,
  onDuplicate,
  onEdit,
  onArchive,
  onArchiveCancel,
  onArchiveConfirm,
  onOpenBuilder,
  onViewSheet,
}: {
  creature: LibraryCreature;
  archiveConfirmOpen: boolean;
  isBusy: boolean;
  onDuplicate: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onArchiveCancel: () => void;
  onArchiveConfirm: () => void;
  onOpenBuilder: () => void;
  onViewSheet: () => void;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/75 p-4 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={creature.type} />
            <SourceBadge sourceType={creature.sourceType} />
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-black text-slate-300">
              {creature.monsterType ?? "Unknown / Unset"}
            </span>
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
            disabled={isBusy}
            type="button"
            onClick={onOpenBuilder}
          >
            Add to Builder
          </button>
          <button
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 transition hover:border-cyan-300/60 hover:text-white"
            disabled={isBusy}
            type="button"
            onClick={onEdit}
          >
            Edit Creature
          </button>
          <button
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 transition hover:border-cyan-300/60 hover:text-white"
            disabled={isBusy}
            type="button"
            onClick={onDuplicate}
          >
            {isBusy ? "Working..." : "Duplicate Creature"}
          </button>
          <button
            className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs font-black text-rose-100 transition hover:border-rose-300 hover:bg-rose-500/20"
            disabled={isBusy}
            type="button"
            onClick={onArchive}
          >
            Remove from Library
          </button>
        </div>
      </div>

      {creature.characterSheetUrl ? (
        <ExternalSheetSummary creature={creature} onViewSheet={onViewSheet} />
      ) : null}

      {archiveConfirmOpen ? (
        <div className="mt-4 rounded-xl border border-rose-400/35 bg-rose-500/10 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-rose-100">
                Remove this creature from the Library?
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-rose-100/70">
                Existing encounter combatants stay in the current roster as
                snapshots. This only removes the template from local Library and
                Builder searches.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-200 transition hover:border-slate-500 hover:text-white"
                type="button"
                onClick={onArchiveCancel}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-rose-400 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-rose-300"
                disabled={isBusy}
                type="button"
                onClick={onArchiveConfirm}
              >
                {isBusy ? "Removing..." : "Confirm Remove"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

function ExternalSheetSummary({
  creature,
  onViewSheet,
}: {
  creature: LibraryCreature;
  onViewSheet: () => void;
}) {
  const url = creature.characterSheetUrl ?? "";
  const safeUrl = getSafeExternalSheetUrl(url);
  const title = creature.characterSheetTitle?.trim() || getUrlHost(url);

  return (
    <div className="mt-4 rounded-xl border border-cyan-300/25 bg-cyan-300/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-cyan-100">
            External Character Sheet
          </p>
          <h4 className="mt-1 text-base font-black text-white">{title}</h4>
          {creature.externalSheetNotes ? (
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-300">
              {creature.externalSheetNotes}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200"
            type="button"
            onClick={onViewSheet}
          >
            View Sheet
          </button>
          {safeUrl ? (
            <a
              className="rounded-lg border border-cyan-300/45 bg-slate-950 px-3 py-2 text-xs font-black text-cyan-100 transition hover:border-cyan-200 hover:text-white"
              href={safeUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open in New Tab
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LibraryErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-rose-100">
            Could not load creature library.
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-rose-100/75">
            {error}
          </p>
        </div>
        {onRetry ? (
          <button
            className="rounded-lg border border-rose-200/45 bg-slate-950 px-3 py-2 text-xs font-black text-rose-100 transition hover:border-rose-100 hover:text-white"
            type="button"
            onClick={onRetry}
          >
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CreatureEditor({
  creature,
  isSaving,
  mode,
  onCancel,
  onSave,
}: {
  creature: LibraryCreature;
  isSaving: boolean;
  mode: EditorMode;
  onCancel: () => void;
  onSave: (creature: LibraryCreature) => void;
}) {
  const [draft, setDraft] = useState<LibraryCreature>(cloneCreature(creature));
  const sheetUrlError = validateExternalSheetUrl(draft.characterSheetUrl ?? "");

  function patch(updates: Partial<LibraryCreature>) {
    setDraft((current) => ({ ...current, ...updates }));
  }

  function patchScores(scores: Partial<AbilityScores>) {
    setDraft((current) => ({
      ...current,
      abilityScores: { ...current.abilityScores, ...scores },
    }));
  }

  function save() {
    const cleaned = normalizeCreature(draft);

    if (!cleaned.name.trim() || sheetUrlError) {
      return;
    }

    onSave(cleaned);
  }

  return (
    <section className="rounded-xl border border-cyan-300/35 bg-slate-950/85 p-4 shadow-2xl shadow-cyan-950/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
            {mode === "create" ? "Create Creature" : "Edit Creature"}
          </p>
          <h3 className="mt-1 text-xl font-black text-white">
            {draft.name || "Unnamed Creature"}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 transition hover:border-slate-500 hover:text-white"
            disabled={isSaving}
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isSaving || !draft.name.trim() || Boolean(sheetUrlError)}
            type="button"
            onClick={save}
          >
            {isSaving ? "Saving..." : "Save Creature"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
        <div className="space-y-4">
          <EditorSection title="Identity">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <TextInput
                label="Name"
                value={draft.name}
                onChange={(name) => patch({ name })}
              />
              <SelectInput
                label="Monster Type"
                value={draft.monsterType ?? "Custom / Other"}
                onChange={(monsterType) =>
                  patch({ monsterType: monsterType as MonsterType })
                }
              >
                {monsterTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </SelectInput>
              <SelectInput
                label="Combat Role"
                value={draft.type}
                onChange={(type) => patch({ type: type as CombatantType })}
              >
                {combatRoleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </SelectInput>
              <SelectInput
                label="Size"
                value={draft.size}
                onChange={(size) => patch({ size })}
              >
                {sizeOptions
                  .filter((size) => size !== "Any")
                  .map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
              </SelectInput>
            </div>
          </EditorSection>

          <EditorSection title="Core Combat Stats">
            <div className="grid gap-2 md:grid-cols-5">
              <TextInput
                label="CR"
                value={draft.challengeRating ?? ""}
                onChange={(challengeRating) => patch({ challengeRating })}
              />
              <NumberInput
                label="AC"
                value={draft.armorClass}
                onChange={(armorClass) => patch({ armorClass })}
              />
              <NumberInput
                label="HP"
                value={draft.maxHp}
                onChange={(maxHp) => patch({ maxHp })}
              />
              <TextInput
                label="Speed"
                value={draft.speed}
                onChange={(speed) => patch({ speed })}
              />
              <NumberInput
                label="Initiative"
                value={draft.initiativeBonus}
                onChange={(initiativeBonus) => patch({ initiativeBonus })}
              />
            </div>
          </EditorSection>

          <EditorSection title="Ability Scores">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
              {Object.entries(draft.abilityScores).map(([ability, value]) => (
                <NumberInput
                  key={ability}
                  label={ability.toUpperCase()}
                  value={value}
                  onChange={(score) =>
                    patchScores({ [ability]: score } as Partial<AbilityScores>)
                  }
                />
              ))}
            </div>
          </EditorSection>

          <EditorSection title="Notes / Tags / Source">
            <div className="grid gap-2 xl:grid-cols-2">
              <TextArea
                label="Notes"
                value={draft.notes ?? ""}
                onChange={(notes) => patch({ notes })}
              />
              <div className="grid gap-2">
                <TextInput
                  label="Tags"
                  value={draft.tags.join(", ")}
                  onChange={(tags) => patch({ tags: splitTags(tags) })}
                />
                <SelectInput
                  label="Source Type"
                  value={draft.sourceType}
                  onChange={(sourceType) => {
                    const nextSourceType = sourceType as LibrarySourceType;
                    patch({
                      licenseName:
                        nextSourceType === "custom"
                          ? "none/custom/private"
                          : draft.licenseName,
                      sourceName:
                        nextSourceType === "custom"
                          ? "User Created"
                          : draft.sourceName,
                      sourceType: nextSourceType,
                    });
                  }}
                >
                  {Object.entries(sourceLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </SelectInput>
                <TextInput
                  label="Source Name"
                  value={draft.sourceName}
                  onChange={(sourceName) => patch({ sourceName })}
                />
                <TextInput
                  label="License"
                  value={draft.licenseName}
                  onChange={(licenseName) => patch({ licenseName })}
                />
              </div>
            </div>
          </EditorSection>

          <EditorSection title="External Character Sheet">
            <div className="grid gap-2 xl:grid-cols-2">
              <TextInput
                label="Character Sheet URL"
                value={draft.characterSheetUrl ?? ""}
                onChange={(characterSheetUrl) => patch({ characterSheetUrl })}
              />
              <TextInput
                label="Display Title"
                value={draft.characterSheetTitle ?? ""}
                onChange={(characterSheetTitle) =>
                  patch({ characterSheetTitle })
                }
              />
              <TextArea
                label="Sheet Notes"
                value={draft.externalSheetNotes ?? ""}
                onChange={(externalSheetNotes) => patch({ externalSheetNotes })}
              />
              <div className="rounded-lg border border-slate-800 bg-slate-950/75 p-3">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Embed Safety
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
                  Optional user-provided link. Some websites block embedded
                  views, so Open in New Tab stays available.
                </p>
                {sheetUrlError ? (
                  <p className="mt-2 text-sm font-bold text-rose-200">
                    {sheetUrlError}
                  </p>
                ) : null}
              </div>
            </div>
          </EditorSection>
        </div>

        <div className="space-y-4">
          <RepeatableEntries
            items={draft.traits}
            title="Traits"
            onChange={(traits) => patch({ traits })}
          />
          <RepeatableEntries
            items={draft.actions}
            title="Actions"
            onChange={(actions) => patch({ actions })}
          />
          <RepeatableEntries
            items={draft.bonusActions ?? []}
            title="Bonus Actions"
            onChange={(bonusActions) => patch({ bonusActions })}
          />
          <RepeatableEntries
            items={draft.reactions ?? []}
            title="Reactions"
            onChange={(reactions) => patch({ reactions })}
          />
          <RepeatableEntries
            items={draft.legendaryActions ?? []}
            title="Legendary Actions"
            onChange={(legendaryActions) => patch({ legendaryActions })}
          />
          <RepeatableEntries
            items={draft.lairActions ?? []}
            title="Lair Actions"
            onChange={(lairActions) => patch({ lairActions })}
          />
        </div>
      </div>
    </section>
  );
}

function RepeatableEntries({
  items,
  title,
  onChange,
}: {
  items: StatBlockAction[];
  title: string;
  onChange: (items: StatBlockAction[]) => void;
}) {
  return (
    <EditorSection title={title}>
      <div className="grid gap-2">
        {items.length === 0 ? (
          <p className="text-xs font-semibold text-slate-500">
            No {title.toLowerCase()} yet.
          </p>
        ) : null}
        {items.map((item, index) => (
          <div
            className="grid gap-2 rounded-lg border border-slate-800 bg-slate-950 p-2"
            key={`${title}-${index}`}
          >
            <TextInput
              label="Name"
              value={item.name}
              onChange={(name) =>
                onChange(
                  items.map((entry, itemIndex) =>
                    itemIndex === index ? { ...entry, name } : entry,
                  ),
                )
              }
            />
            <TextArea
              label="Description"
              value={item.description}
              onChange={(description) =>
                onChange(
                  items.map((entry, itemIndex) =>
                    itemIndex === index ? { ...entry, description } : entry,
                  ),
                )
              }
            />
            <button
              className="justify-self-start rounded-md border border-slate-700 px-2 py-1 text-[11px] font-black text-slate-300 transition hover:border-rose-400 hover:text-rose-200"
              type="button"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-300/60 hover:text-white"
          type="button"
          onClick={() => onChange([...items, { ...emptyAction }])}
        >
          Add {title.slice(0, -1)}
        </button>
      </div>
    </EditorSection>
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

function EditorSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-3">
      <h4 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {title}
      </h4>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
      {label}
      <input
        className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-semibold normal-case tracking-normal text-white outline-none focus:border-cyan-300"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
      {label}
      <input
        className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-semibold normal-case tracking-normal text-white outline-none focus:border-cyan-300"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function SelectInput({
  children,
  label,
  value,
  onChange,
}: {
  children: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
      {label}
      <select
        className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-semibold normal-case tracking-normal text-white outline-none focus:border-cyan-300"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
      {label}
      <textarea
        className="min-h-24 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm font-semibold normal-case leading-6 tracking-normal text-white outline-none focus:border-cyan-300"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function createBlankCreature(): LibraryCreature {
  return {
    accentColor: "Purple",
    actions: [{ name: "Improvised Strike", description: "Describe the attack." }],
    armorClass: 10,
    attribution: undefined,
    autoRollEligible: true,
    challengeRating: "0",
    abilityScores: { cha: 10, con: 10, dex: 10, int: 10, str: 10, wis: 10 },
    id: `custom-creature-${Date.now()}`,
    importMethod: undefined,
    initiativeBonus: 0,
    languages: "None",
    licenseName: "none/custom/private",
    maxHp: 1,
    monsterType: "Custom / Other",
    name: "",
    notes: "",
    senses: "passive Perception 10",
    size: "Medium",
    sourceName: "User Created",
    sourceType: "custom",
    sourceUrl: undefined,
    speed: "30 ft.",
    tags: ["custom"],
    traits: [],
    type: "enemy",
  };
}

function cloneCreature(creature: LibraryCreature): LibraryCreature {
  return {
    ...creature,
    abilityScores: { ...creature.abilityScores },
    actions: cloneEntries(creature.actions) ?? [],
    bonusActions: cloneEntries(creature.bonusActions),
    lairActions: cloneEntries(creature.lairActions),
    legendaryActions: cloneEntries(creature.legendaryActions),
    reactions: cloneEntries(creature.reactions),
    tags: [...creature.tags],
    traits: cloneEntries(creature.traits) ?? [],
  };
}

function cloneEntries<T extends StatBlockAction | StatBlockTrait>(
  items?: T[],
): T[] | undefined {
  return items?.map((item) => ({ ...item }));
}

function normalizeCreature(creature: LibraryCreature): LibraryCreature {
  const characterSheetUrl = normalizeExternalSheetUrl(creature.characterSheetUrl);
  const characterSheetTitle = creature.characterSheetTitle?.trim();
  const externalSheetNotes = creature.externalSheetNotes?.trim();

  return {
    ...creature,
    actions: cleanEntries(creature.actions),
    armorClass: clampNumber(creature.armorClass, 0),
    bonusActions: cleanEntries(creature.bonusActions),
    challengeRating: creature.challengeRating?.trim() || "0",
    characterSheetTitle: characterSheetTitle || undefined,
    characterSheetUrl,
    externalSheetNotes: externalSheetNotes || undefined,
    initiativeBonus: Number.isFinite(creature.initiativeBonus)
      ? creature.initiativeBonus
      : 0,
    lairActions: cleanEntries(creature.lairActions),
    languages: creature.languages.trim() || "None",
    legendaryActions: cleanEntries(creature.legendaryActions),
    maxHp: clampNumber(creature.maxHp, 1),
    monsterType: creature.monsterType ?? "Custom / Other",
    name: creature.name.trim(),
    notes: creature.notes?.trim(),
    reactions: cleanEntries(creature.reactions),
    senses: creature.senses.trim() || "passive Perception 10",
    size: creature.size || "Medium",
    sourceName: creature.sourceName.trim() || "User Created",
    speed: creature.speed.trim() || "30 ft.",
    tags: creature.tags.map((tag) => tag.trim()).filter(Boolean),
    traits: cleanEntries(creature.traits),
  };
}

function cleanEntries<T extends StatBlockAction | StatBlockTrait>(
  items?: T[],
): T[] {
  return (items ?? []).filter(
    (item) => item.name.trim() || item.description.trim(),
  );
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function clampNumber(value: number, minimum: number) {
  return Number.isFinite(value) ? Math.max(minimum, value) : minimum;
}

function normalizeExternalSheetUrl(value?: string) {
  const trimmed = value?.trim() ?? "";

  return trimmed && validateExternalSheetUrl(trimmed) === ""
    ? trimmed
    : undefined;
}

function validateExternalSheetUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Use an http:// or https:// character sheet URL.";
    }

    return "";
  } catch {
    return "Enter a valid character sheet URL starting with http:// or https://.";
  }
}

function matchesChallengeFilter(value: string | undefined, filter: CrFilter) {
  if (filter === "all") {
    return true;
  }

  const cr = parseChallengeRating(value);

  if (filter === "0") {
    return cr === 0;
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
