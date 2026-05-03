"use client";

import { useMemo, useState } from "react";
import type {
  CombatGroup,
  CombatantType,
  CreatureTemplate,
  EncounterCombatant,
  EncounterWave,
  MonsterType,
  StatBlockAction,
  StatBlockTrait,
} from "@/lib/encounter/types";
import {
  combatGroupOptions,
  combatantTypeOrder,
  getCombatGroupColorClass,
} from "@/lib/encounter/colors";
import { EmptyState } from "./empty-state";
import { TypeBadge } from "./type-badge";

type EncounterBuilderProps = {
  campaignId: string;
  combatGroups: CombatGroup[];
  combatants: EncounterCombatant[];
  encounterName?: string;
  templates: CreatureTemplate[];
  waves: EncounterWave[];
  onCreateGroup: (group: { name: string; color: string }) => void;
  onRenameGroup: (group: { groupId: string; newLabel: string }) => void;
  onUpdateGroupColor: (groupId: string, color: string) => void;
  onClearGroup: (groupId: string) => void;
  onRemoveGroup: (groupId: string) => void;
  onCreateWave: (wave: {
    deployed?: boolean;
    description?: string;
    id?: string;
    name: string;
  }) => void;
  onDeleteWave: (waveId: string) => void;
  onCampaignChange: (campaignId: string) => void;
  onAdd: (template: CreatureTemplate, count: number, waveId?: string) => void;
  onDuplicate: (combatant: EncounterCombatant) => void;
  onRemove: (combatantId: string) => void;
  onUpdate: (combatantId: string, updates: Partial<EncounterCombatant>) => void;
  onUpdateWave: (
    waveId: string,
    updates: Partial<Pick<EncounterWave, "description" | "name">>,
  ) => void;
  onLaunchRunner: () => void;
};

type TypeFilter = "all" | CombatantType | "npc";
type MonsterTypeFilter = "all" | MonsterType;

const quickFilters: Array<{ label: string; value: TypeFilter }> = [
  { label: "All", value: "all" },
  { label: "PC", value: "pc" },
  { label: "Enemy", value: "enemy" },
  { label: "Boss", value: "boss" },
  { label: "NPC", value: "npc" },
  { label: "Ally", value: "ally" },
  { label: "Summon", value: "summon" },
  { label: "Minion", value: "minion" },
  { label: "Neutral", value: "neutral" },
];

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

const campaignOptions = [
  { id: "lantern-road", name: "The Lantern Road" },
  { id: "moonwell-vale", name: "Moonwell Vale" },
  { id: "ash-gate", name: "Ash Gate" },
  { id: "violet-keg-cellars", name: "Violet Keg Cellars" },
  { id: "unassigned", name: "Unassigned / No Campaign" },
];

export function EncounterBuilder({
  campaignId,
  combatGroups,
  combatants,
  encounterName = "Lantern Alley Ambush",
  templates,
  waves,
  onCampaignChange,
  onCreateGroup,
  onRenameGroup,
  onUpdateGroupColor,
  onClearGroup,
  onRemoveGroup,
  onCreateWave,
  onDeleteWave,
  onAdd,
  onDuplicate,
  onRemove,
  onUpdate,
  onUpdateWave,
  onLaunchRunner,
}: EncounterBuilderProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [monsterTypeFilter, setMonsterTypeFilter] =
    useState<MonsterTypeFilter>("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [crMin, setCrMin] = useState("");
  const [crMax, setCrMax] = useState("");
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(
    templates[3]?.id ?? templates[0]?.id ?? null,
  );
  const [addCounts, setAddCounts] = useState<Record<string, number>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [draftNotice, setDraftNotice] = useState("");
  const [activeWaveId, setActiveWaveId] = useState(waves[0]?.id ?? "wave-1");

  const availableSizes = useMemo(
    () => [...new Set(templates.map((template) => template.size))].sort(),
    [templates],
  );

  const filteredTemplates = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const minCr = parseChallengeRating(crMin);
    const maxCr = parseChallengeRating(crMax);

    return templates.filter((template) => {
      const templateCr = parseChallengeRating(template.challengeRating);
      const searchable = [
        template.name,
        template.monsterType ?? "",
        template.type,
        template.size,
        template.challengeRating ?? "",
        ...template.tags,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalized.length === 0 || searchable.includes(normalized);
      const matchesMonsterType =
        monsterTypeFilter === "all" || template.monsterType === monsterTypeFilter;
      const matchesType =
        typeFilter === "all" ||
        template.type === typeFilter ||
        (typeFilter === "npc" && template.tags.includes("npc"));
      const matchesSize = sizeFilter === "all" || template.size === sizeFilter;
      const matchesMin = minCr === null || templateCr === null || templateCr >= minCr;
      const matchesMax = maxCr === null || templateCr === null || templateCr <= maxCr;

      return (
        matchesQuery &&
        matchesMonsterType &&
        matchesType &&
        matchesSize &&
        matchesMin &&
        matchesMax
      );
    });
  }, [crMax, crMin, monsterTypeFilter, query, sizeFilter, templates, typeFilter]);

  const activeWaveKey = waves.some((wave) => wave.id === activeWaveId)
    ? activeWaveId
    : waves[0]?.id ?? "wave-1";
  const activeWave = waves.find((wave) => wave.id === activeWaveKey) ?? waves[0];
  const activeWaveCombatants = useMemo(
    () =>
      combatants.filter((combatant) =>
        activeWaveKey === "wave-1"
          ? combatant.waveId === activeWaveKey || !combatant.waveId
          : combatant.waveId === activeWaveKey,
      ),
    [activeWaveKey, combatants],
  );
  const groupedCombatants = useMemo(
    () => groupCombatantsByCombatGroup(activeWaveCombatants, combatGroups),
    [activeWaveCombatants, combatGroups],
  );
  const groupCount = groupedCombatants.length;
  const bossCount = combatants.filter((combatant) => combatant.type === "boss").length;
  const hasLairActions = combatants.some(
    (combatant) => combatant.lairActions && combatant.lairActions.length > 0,
  );
  const campaignName = getCampaignName(campaignId);

  function addCopies(template: CreatureTemplate, count = 1) {
    onAdd(template, count, activeWaveKey);
  }

  function getAddCount(templateId: string) {
    return addCounts[templateId] ?? 2;
  }

  function setAddCount(templateId: string, count: number) {
    setAddCounts((current) => ({
      ...current,
      [templateId]: Math.max(1, Math.min(20, count)),
    }));
  }

  return (
    <div className="space-y-4">
      <CurrentEncounterHeader
        bossCount={bossCount}
        campaignId={campaignId}
        campaignName={campaignName}
        combatantCount={combatants.length}
        draftNotice={draftNotice}
        groupCount={groupCount}
        hasLairActions={hasLairActions}
        encounterName={encounterName}
        onCampaignChange={(nextCampaignId) => {
          onCampaignChange(nextCampaignId);
          setDraftNotice("");
        }}
        onLaunchRunner={onLaunchRunner}
        onSaveDraft={() =>
          setDraftNotice(`Draft staged for ${getCampaignName(campaignId)}.`)
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_27rem]">
      <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white">Creature Browser</h2>
            <p className="mt-1 text-sm font-semibold text-slate-400">
              Search local sample creatures, preview stat details, and add copies.
            </p>
          </div>
          <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-black text-slate-300">
            {filteredTemplates.length} results
          </span>
        </div>

        <QuickFilters value={typeFilter} onChange={setTypeFilter} />

        <BrowserFilters
          crMax={crMax}
          crMin={crMin}
          monsterTypeFilter={monsterTypeFilter}
          query={query}
          sizeFilter={sizeFilter}
          sizes={availableSizes}
          typeFilter={typeFilter}
          onCrMaxChange={setCrMax}
          onCrMinChange={setCrMin}
          onMonsterTypeFilterChange={setMonsterTypeFilter}
          onQueryChange={setQuery}
          onReset={() => {
            setQuery("");
            setMonsterTypeFilter("all");
            setTypeFilter("all");
            setSizeFilter("all");
            setCrMin("");
            setCrMax("");
          }}
          onSizeFilterChange={setSizeFilter}
          onTypeFilterChange={setTypeFilter}
        />

        <div className="mt-3 overflow-hidden rounded-xl border border-slate-800">
          <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_5rem_4rem_4rem_5rem_7rem] gap-2 border-b border-slate-800 bg-slate-900/80 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-500">
            <span>CR</span>
            <span>Creature</span>
            <span>Type</span>
            <span>AC</span>
            <span>HP</span>
            <span>Init</span>
            <span className="text-right">Add</span>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="bg-slate-950/70 p-6">
              <EmptyState
                detail="Try clearing filters or searching by name, tag, type, or size."
                title="No creatures found"
              />
            </div>
          ) : null}

          {filteredTemplates.map((template) => {
            const isExpanded = expandedTemplateId === template.id;

            return (
              <div
                className="border-b border-slate-800 last:border-b-0"
                key={template.id}
              >
                <CreatureResultRow
                  isExpanded={isExpanded}
                  template={template}
                  onAdd={() => addCopies(template)}
                  onToggle={() =>
                    setExpandedTemplateId(isExpanded ? null : template.id)
                  }
                />
                {isExpanded ? (
                  <CreaturePreview
                    addCount={getAddCount(template.id)}
                    template={template}
                    onAddMultiple={() => addCopies(template, getAddCount(template.id))}
                    onAddOnce={() => addCopies(template)}
                    onAddCountChange={(count) => setAddCount(template.id, count)}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <aside className="space-y-3">
        <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <BuilderCombatGroups
            combatGroups={combatGroups}
            combatants={combatants}
            onCreateGroup={onCreateGroup}
            onRenameGroup={onRenameGroup}
            onUpdateGroupColor={onUpdateGroupColor}
            onClearGroup={onClearGroup}
            onRemoveGroup={onRemoveGroup}
          />
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-white">
                Encounter Roster
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Adding creatures sends them to {activeWave?.name ?? "Wave 1"}.
              </p>
            </div>
            <span className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] font-black text-slate-400">
              {activeWaveCombatants.length} in tab
            </span>
          </div>

          <WaveTabs
            activeWaveId={activeWave?.id ?? "wave-1"}
            combatants={combatants}
            waves={waves}
            onCreateWave={() => {
              const nextWave = createNextWave(waves);
              onCreateWave(nextWave);
              setActiveWaveId(nextWave.id);
            }}
            onDeleteWave={(waveId) => {
              const remaining = waves.filter((wave) => wave.id !== waveId);
              onDeleteWave(waveId);
              setActiveWaveId(remaining[0]?.id ?? "wave-1");
            }}
            onRenameWave={onUpdateWave}
            onSelectWave={setActiveWaveId}
          />

          {activeWave?.description ? (
            <p className="mt-3 rounded-lg border border-slate-800 bg-slate-900/55 px-3 py-2 text-xs font-semibold leading-5 text-slate-400">
              {activeWave.description}
            </p>
          ) : null}

          <div className="mt-3 space-y-3">
            {activeWaveCombatants.length === 0 ? (
              <EmptyState
                detail="Add creatures from the browser to start building."
                title="No creatures in this wave yet"
              />
            ) : null}

            {groupedCombatants.map((group) => (
              <RosterGroup
                color={group.color}
                combatants={group.combatants}
                groups={combatGroups}
                isCollapsed={Boolean(collapsedGroups[group.key])}
                key={`${group.name}-${group.color}`}
                name={group.name}
                onDuplicate={onDuplicate}
                onRemove={onRemove}
                onToggleCollapse={() =>
                  setCollapsedGroups((current) => ({
                    ...current,
                    [group.key]: !current[group.key],
                  }))
                }
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </section>
      </aside>
      </div>
    </div>
  );
}

function QuickFilters({
  value,
  onChange,
}: {
  value: TypeFilter;
  onChange: (value: TypeFilter) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {quickFilters.map((filter) => (
        <button
          className={`rounded-lg border px-2.5 py-1.5 text-xs font-black transition ${
            value === filter.value
              ? "border-cyan-300 bg-cyan-300 text-slate-950"
              : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white"
          }`}
          key={`${filter.label}-${filter.value}`}
          type="button"
          onClick={() => onChange(filter.value)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

function CurrentEncounterHeader({
  bossCount,
  campaignId,
  campaignName,
  combatantCount,
  draftNotice,
  encounterName,
  groupCount,
  hasLairActions,
  onCampaignChange,
  onLaunchRunner,
  onSaveDraft,
}: {
  bossCount: number;
  campaignId: string;
  campaignName: string;
  combatantCount: number;
  draftNotice: string;
  encounterName: string;
  groupCount: number;
  hasLairActions: boolean;
  onCampaignChange: (campaignId: string) => void;
  onLaunchRunner: () => void;
  onSaveDraft: () => void;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/75 p-4 shadow-2xl shadow-black/20">
      <div className="grid gap-4 xl:grid-cols-[minmax(16rem,0.9fr)_minmax(20rem,1.1fr)_minmax(18rem,0.9fr)] xl:items-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
            Current Encounter
          </p>
          <h2 className="mt-1 text-2xl font-black leading-tight text-white">
            {encounterName}
          </h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Campaign: {campaignName}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <SummaryPill label="Combatants" value={String(combatantCount)} />
          <SummaryPill label="Groups" value={String(groupCount)} />
          <SummaryPill label="Bosses" value={bossCount > 0 ? String(bossCount) : "None"} />
          <SummaryPill label="Lair" value={hasLairActions ? "Ready" : "None"} />
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_auto_auto] xl:grid-cols-1 2xl:grid-cols-[minmax(12rem,1fr)_auto_auto]">
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
            Campaign
            <select
              className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-semibold normal-case tracking-normal text-white outline-none focus:border-cyan-300"
              value={campaignId}
              onChange={(event) => onCampaignChange(event.target.value)}
            >
              {campaignOptions.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="self-end rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-300/60 hover:text-white"
            type="button"
            onClick={onSaveDraft}
          >
            Save Draft later
          </button>
          <button
            className="self-end rounded-lg bg-amber-300 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-amber-200"
            type="button"
            onClick={onLaunchRunner}
          >
            Launch Runner
          </button>
        </div>
      </div>

      {draftNotice ? (
        <p className="mt-3 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100">
          {draftNotice} Supabase save comes later.
        </p>
      ) : null}
    </section>
  );
}

function BrowserFilters({
  crMax,
  crMin,
  monsterTypeFilter,
  query,
  sizeFilter,
  sizes,
  typeFilter,
  onCrMaxChange,
  onCrMinChange,
  onMonsterTypeFilterChange,
  onQueryChange,
  onReset,
  onSizeFilterChange,
  onTypeFilterChange,
}: {
  crMax: string;
  crMin: string;
  monsterTypeFilter: MonsterTypeFilter;
  query: string;
  sizeFilter: string;
  sizes: string[];
  typeFilter: TypeFilter;
  onCrMaxChange: (value: string) => void;
  onCrMinChange: (value: string) => void;
  onMonsterTypeFilterChange: (value: MonsterTypeFilter) => void;
  onQueryChange: (value: string) => void;
  onReset: () => void;
  onSizeFilterChange: (value: string) => void;
  onTypeFilterChange: (value: TypeFilter) => void;
}) {
  return (
    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/55 p-3">
      <div className="grid gap-2 lg:grid-cols-[minmax(12rem,1fr)_9rem_8rem_7rem_7rem_8rem_auto]">
        <input
          aria-label="Search creatures"
          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
          placeholder="Search name, tag, role..."
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
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
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value as TypeFilter)}
        >
          <option value="all">All roles</option>
          <option value="npc">npc</option>
          {combatantTypeOrder.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select
          aria-label="Size filter"
          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-semibold text-white outline-none focus:border-cyan-300"
          value={sizeFilter}
          onChange={(event) => onSizeFilterChange(event.target.value)}
        >
          <option value="all">All sizes</option>
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <input
          aria-label="Minimum challenge rating"
          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
          placeholder="CR min"
          value={crMin}
          onChange={(event) => onCrMinChange(event.target.value)}
        />
        <input
          aria-label="Maximum challenge rating"
          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
          placeholder="CR max"
          value={crMax}
          onChange={(event) => onCrMaxChange(event.target.value)}
        />
        <button
          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs font-black text-slate-300 transition hover:border-cyan-300/60 hover:text-white"
          type="button"
          onClick={onReset}
        >
          Reset
        </button>
      </div>
      <p className="mt-2 text-[11px] font-bold text-slate-500">
        Advanced Filters later
      </p>
    </div>
  );
}

function CreatureResultRow({
  isExpanded,
  template,
  onAdd,
  onToggle,
}: {
  isExpanded: boolean;
  template: CreatureTemplate;
  onAdd: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      className={`grid grid-cols-[4.5rem_minmax(0,1fr)_5rem_4rem_4rem_5rem_7rem] items-center gap-2 px-3 py-2 text-sm transition ${
        isExpanded ? "bg-slate-900/80" : "bg-slate-950/65 hover:bg-slate-900/55"
      }`}
    >
      <button
        className="text-left font-black text-slate-300"
        type="button"
        onClick={onToggle}
      >
        CR {template.challengeRating ?? "-"}
      </button>
      <button
        className="min-w-0 text-left"
        type="button"
        onClick={onToggle}
      >
        <span className="block truncate font-black text-white">{template.name}</span>
        <span className="block truncate text-xs font-semibold text-slate-500">
          {template.monsterType ?? "Unknown / Unset"} - {template.size}
        </span>
      </button>
      <TypeBadge type={template.type} />
      <span className="font-bold text-slate-300">{template.armorClass}</span>
      <span className="font-bold text-slate-300">{template.maxHp}</span>
      <span className="font-bold text-slate-300">
        {formatModifier(template.initiativeBonus)}
      </span>
      <div className="flex justify-end gap-1.5">
        <button
          className="h-8 rounded-lg bg-cyan-300 px-2.5 text-xs font-black text-slate-950 transition hover:bg-cyan-200"
          type="button"
          onClick={onAdd}
        >
          Add
        </button>
        <button
          className="h-8 rounded-lg border border-slate-700 px-2 text-xs font-black text-slate-300 hover:border-cyan-300"
          type="button"
          onClick={onToggle}
        >
          {isExpanded ? "Up" : "More"}
        </button>
      </div>
    </div>
  );
}

function CreaturePreview({
  addCount,
  template,
  onAddCountChange,
  onAddMultiple,
  onAddOnce,
}: {
  addCount: number;
  template: CreatureTemplate;
  onAddCountChange: (count: number) => void;
  onAddMultiple: () => void;
  onAddOnce: () => void;
}) {
  return (
    <div className="border-t border-slate-800 bg-slate-950 px-4 py-4">
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={template.type} />
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-black text-slate-300">
              {template.monsterType ?? "Unknown / Unset"}
            </span>
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-black text-slate-300">
              {template.size}
            </span>
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-black text-slate-300">
              CR {template.challengeRating ?? "-"}
            </span>
          </div>
          <h3 className="mt-2 text-xl font-black text-white">{template.name}</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
            {template.notes}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniStat label="AC" value={String(template.armorClass)} />
            <MiniStat label="HP" value={String(template.maxHp)} />
            <MiniStat label="Speed" value={template.speed} />
            <MiniStat label="Init" value={formatModifier(template.initiativeBonus)} />
          </div>

          <AbilityScores scores={template.abilityScores} />

          <PreviewSection items={template.traits} title="Traits" />
          <PreviewSection items={template.actions} title="Actions" />
          <PreviewSection items={template.bonusActions} title="Bonus Actions" />
          <PreviewSection items={template.reactions} title="Reactions" />
          <PreviewSection items={template.legendaryActions} title="Legendary Actions" />
          <PreviewSection items={template.lairActions} title="Lair Actions" />
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/65 p-3">
          <h4 className="text-sm font-black text-white">Add to Encounter</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200"
              type="button"
              onClick={onAddOnce}
            >
              Add Once
            </button>
            <button
              className="cursor-not-allowed rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-black text-slate-500"
              disabled
              type="button"
            >
              View Full later
            </button>
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
              Quantity
              <input
                className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-semibold normal-case tracking-normal text-white outline-none focus:border-cyan-300"
                min={1}
                max={20}
                type="number"
                value={addCount}
                onChange={(event) => onAddCountChange(Number(event.target.value))}
              />
            </label>
            <button
              className="self-end rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-200 transition hover:border-cyan-300/60 hover:text-white"
              type="button"
              onClick={onAddMultiple}
            >
              Add Multiple
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {template.tags.map((tag) => (
              <span
                className="rounded-md bg-slate-950 px-2 py-1 text-[11px] font-bold text-slate-400"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RosterGroup({
  color,
  combatants,
  groups,
  isCollapsed,
  name,
  onDuplicate,
  onRemove,
  onToggleCollapse,
  onUpdate,
}: {
  color?: string;
  combatants: EncounterCombatant[];
  groups: CombatGroup[];
  isCollapsed: boolean;
  name: string;
  onDuplicate: (combatant: EncounterCombatant) => void;
  onRemove: (combatantId: string) => void;
  onToggleCollapse: () => void;
  onUpdate: (combatantId: string, updates: Partial<EncounterCombatant>) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/45">
      <button
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
        type="button"
        onClick={onToggleCollapse}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${getCombatGroupColorClass(color) ?? "bg-slate-500"}`}
          />
          <span className="truncate text-sm font-black text-slate-100">{name}</span>
          <span className="text-[11px] font-bold text-slate-500">
            {combatants.length} combatants
          </span>
        </span>
        <span className="shrink-0 rounded-md border border-slate-700 px-2 py-1 text-[10px] font-black text-slate-300">
          {isCollapsed ? "Expand" : "Collapse"}
        </span>
      </button>
      {!isCollapsed ? (
        <div className="grid gap-1.5 border-t border-slate-800 p-2">
          {combatants.map((combatant) => (
            <RosterEditor
              combatant={combatant}
              groups={groups}
              key={combatant.combatantId}
              onDuplicate={() => onDuplicate(combatant)}
              onRemove={() => onRemove(combatant.combatantId)}
              onUpdate={(updates) => onUpdate(combatant.combatantId, updates)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RosterEditor({
  combatant,
  groups,
  onDuplicate,
  onRemove,
  onUpdate,
}: {
  combatant: EncounterCombatant;
  groups: CombatGroup[];
  onDuplicate: () => void;
  onRemove: () => void;
  onUpdate: (updates: Partial<EncounterCombatant>) => void;
}) {
  const assignedGroup = groups.find(
    (group) => group.id === combatant.combatGroupId,
  );
  const groupColor =
    assignedGroup?.color ?? combatant.combatGroupColor ?? combatant.accentColor;
  const selectedGroupValue = getSelectedGroupValue(combatant, groups);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/65 p-2">
      <div className="flex items-start gap-2">
        <span
          className={`mt-1 h-9 w-1 shrink-0 rounded-full ${getCombatGroupColorClass(groupColor) ?? "bg-slate-500"}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={combatant.type} />
            {combatant.waveLabel ? (
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[11px] font-black text-amber-100">
                {combatant.waveLabel}
              </span>
            ) : null}
            <span className="text-xs font-bold text-slate-500">
              AC {combatant.armorClass}
            </span>
            <span className="text-xs font-bold text-slate-500">
              HP {combatant.currentHp}/{combatant.maxHp}
            </span>
            <span className="text-xs font-bold text-slate-500">
              Init {formatModifier(combatant.initiativeBonus)}
            </span>
          </div>
          <input
            aria-label={`Rename ${combatant.displayName}`}
            className="mt-1 h-8 w-full rounded-md border border-slate-700 bg-slate-950 px-2 text-sm font-black text-white outline-none focus:border-cyan-300"
            value={combatant.displayName}
            onChange={(event) => onUpdate({ displayName: event.target.value })}
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <GroupAssignmentField
              groups={groups}
              value={selectedGroupValue}
              onChange={(value) => {
                const group = groups.find((item) => item.id === value);

                if (!group || value === "ungrouped") {
                  onUpdate({
                    combatGroupId: undefined,
                    combatGroupColor: "None",
                    combatGroupLabel: "Ungrouped",
                  });
                  return;
                }

                onUpdate({
                  combatGroupId: group.id,
                  combatGroupColor: group.color,
                  combatGroupLabel: group.name,
                });
              }}
            />
            <TextField
              label="Display"
              value={combatant.displayName}
              onChange={(displayName) => onUpdate({ displayName })}
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <button
            className="h-7 rounded-md border border-slate-700 px-2 text-[11px] font-bold text-slate-300 hover:border-cyan-300"
            type="button"
            onClick={onDuplicate}
          >
            Copy
          </button>
          <button
            className="h-7 rounded-md border border-slate-700 px-2 text-[11px] font-bold text-slate-300 hover:border-rose-400 hover:text-rose-200"
            type="button"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function WaveTabs({
  activeWaveId,
  combatants,
  waves,
  onCreateWave,
  onDeleteWave,
  onRenameWave,
  onSelectWave,
}: {
  activeWaveId: string;
  combatants: EncounterCombatant[];
  waves: EncounterWave[];
  onCreateWave: () => void;
  onDeleteWave: (waveId: string) => void;
  onRenameWave: (
    waveId: string,
    updates: Partial<Pick<EncounterWave, "description" | "name">>,
  ) => void;
  onSelectWave: (waveId: string) => void;
}) {
  const [menuWaveId, setMenuWaveId] = useState<string | null>(null);
  const [renameWaveId, setRenameWaveId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [deleteConfirmWaveId, setDeleteConfirmWaveId] = useState<string | null>(
    null,
  );

  function startRename(wave: EncounterWave) {
    setRenameWaveId(wave.id);
    setRenameDraft(wave.name);
    setDeleteConfirmWaveId(null);
  }

  function saveRename(waveId: string) {
    const nextName = renameDraft.trim();

    if (nextName) {
      onRenameWave(waveId, { name: nextName });
    }

    setRenameWaveId(null);
    setRenameDraft("");
    setMenuWaveId(null);
  }

  return (
    <div className="relative mt-3 flex flex-wrap gap-1.5 border-b border-slate-800 pb-2">
      {waves.map((wave) => {
        const isActive = activeWaveId === wave.id;
        const count = combatants.filter((combatant) =>
          wave.id === "wave-1"
            ? combatant.waveId === wave.id || !combatant.waveId
            : combatant.waveId === wave.id,
        ).length;

        return (
          <div className="relative" key={wave.id}>
            <div
              className={`flex items-center overflow-hidden rounded-lg border text-xs font-black transition ${
                isActive
                  ? "border-cyan-300 bg-cyan-300 text-slate-950"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white"
              }`}
            >
              <button
                className="px-2.5 py-1.5"
                type="button"
                onClick={() => onSelectWave(wave.id)}
              >
                {wave.name}
                <span className="ml-1 opacity-70">({count})</span>
              </button>
              <button
                aria-label={`Open ${wave.name} menu`}
                className={`border-l px-2 py-1.5 ${
                  isActive ? "border-slate-950/20" : "border-slate-700"
                }`}
                type="button"
                onClick={() => {
                  setMenuWaveId(menuWaveId === wave.id ? null : wave.id);
                  setDeleteConfirmWaveId(null);
                  setRenameWaveId(null);
                }}
              >
                ⋮
              </button>
            </div>

            {menuWaveId === wave.id ? (
              <div className="absolute left-0 z-20 mt-1 w-64 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl shadow-black/40">
                {renameWaveId === wave.id ? (
                  <div className="grid gap-2">
                    <input
                      aria-label={`Rename ${wave.name}`}
                      autoFocus
                      className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs font-bold text-white outline-none focus:border-cyan-300"
                      value={renameDraft}
                      onChange={(event) => setRenameDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          saveRename(wave.id);
                        }

                        if (event.key === "Escape") {
                          setRenameWaveId(null);
                          setRenameDraft("");
                        }
                      }}
                    />
                    <div className="flex gap-1.5">
                      <button
                        className="h-7 flex-1 rounded-md bg-cyan-300 px-2 text-[10px] font-black text-slate-950"
                        type="button"
                        onClick={() => saveRename(wave.id)}
                      >
                        Save
                      </button>
                      <button
                        className="h-7 flex-1 rounded-md border border-slate-700 px-2 text-[10px] font-black text-slate-300"
                        type="button"
                        onClick={() => setRenameWaveId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : deleteConfirmWaveId === wave.id ? (
                  <div className="grid gap-2">
                    <p className="text-xs font-semibold leading-5 text-slate-300">
                      Move this wave&apos;s combatants to the first remaining
                      wave and delete it?
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        className="h-7 flex-1 rounded-md bg-rose-400 px-2 text-[10px] font-black text-slate-950"
                        type="button"
                        onClick={() => {
                          onDeleteWave(wave.id);
                          setMenuWaveId(null);
                          setDeleteConfirmWaveId(null);
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        className="h-7 flex-1 rounded-md border border-slate-700 px-2 text-[10px] font-black text-slate-300"
                        type="button"
                        onClick={() => setDeleteConfirmWaveId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-1">
                    <button
                      className="rounded-md px-2 py-1.5 text-left text-xs font-black text-slate-200 hover:bg-slate-900"
                      type="button"
                      onClick={() => startRename(wave)}
                    >
                      Rename Wave
                    </button>
                    <button
                      className="rounded-md px-2 py-1.5 text-left text-xs font-black text-rose-200 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:text-slate-600"
                      disabled={waves.length <= 1}
                      type="button"
                      onClick={() => setDeleteConfirmWaveId(wave.id)}
                    >
                      Delete Wave
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        );
      })}

      <button
        aria-label="Create next wave"
        className="rounded-lg border border-dashed border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-black text-slate-300 transition hover:border-cyan-300/60 hover:text-white"
        type="button"
        onClick={onCreateWave}
      >
        +
      </button>
    </div>
  );
}

function BuilderCombatGroups({
  combatGroups,
  combatants,
  onCreateGroup,
  onRenameGroup,
  onUpdateGroupColor,
  onClearGroup,
  onRemoveGroup,
}: {
  combatGroups: CombatGroup[];
  combatants: EncounterCombatant[];
  onCreateGroup: (group: { name: string; color: string }) => void;
  onRenameGroup: (group: { groupId: string; newLabel: string }) => void;
  onUpdateGroupColor: (groupId: string, color: string) => void;
  onClearGroup: (groupId: string) => void;
  onRemoveGroup: (groupId: string) => void;
}) {
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("Red");
  const colorOptions = combatGroupOptions.filter(
    (option) => option.color !== "None",
  );

  function createGroup() {
    const name = newGroupName.trim();

    if (!name) {
      return;
    }

    onCreateGroup({ name, color: newGroupColor });
    setNewGroupName("");
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-black text-white">Combat Groups</h3>
        <span className="text-xs font-bold text-slate-500">
          {combatGroups.length} groups
        </span>
      </div>

      <div className="mt-3 grid gap-1.5">
        {combatGroups.map((group) => (
          <div
            className="grid gap-2 rounded-lg border border-slate-800 bg-slate-900/65 px-2.5 py-2"
            key={group.id}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${getCombatGroupColorClass(group.color) ?? "bg-slate-500"}`}
              />
              <input
                aria-label={`Rename ${group.name}`}
                className="h-7 min-w-0 flex-1 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs font-black text-white outline-none focus:border-cyan-300"
                value={group.name}
                onChange={(event) => {
                  const newLabel = event.target.value.trim();
                  if (newLabel) {
                    onRenameGroup({ groupId: group.id, newLabel });
                  }
                }}
                onBlur={(event) => {
                  if (!event.target.value.trim()) {
                    onRenameGroup({
                      groupId: group.id,
                      newLabel: "Unnamed Group",
                    });
                  }
                }}
              />
              <span className="rounded-full bg-slate-950 px-2 py-1 text-[11px] font-black text-slate-400">
                {countCombatantsInGroup(combatants, group)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {colorOptions.slice(0, 6).map((option) => (
                <button
                  aria-label={`Use ${option.color} for ${group.name}`}
                  className={`h-5 w-5 rounded-md border ${option.className} ${
                    group.color === option.color
                      ? "border-white ring-1 ring-white/70"
                      : "border-slate-800"
                  }`}
                  key={option.color}
                  title={option.color}
                  type="button"
                  onClick={() => onUpdateGroupColor(group.id, option.color)}
                />
              ))}
              <button
                className="ml-auto h-6 rounded-md border border-slate-700 px-2 text-[10px] font-black text-slate-500 hover:border-cyan-300 hover:text-cyan-100"
                type="button"
                onClick={() => onClearGroup(group.id)}
              >
                Clear
              </button>
              <button
                className="h-6 rounded-md border border-slate-700 px-2 text-[10px] font-black text-slate-500 hover:border-rose-400 hover:text-rose-200"
                type="button"
                onClick={() => onRemoveGroup(group.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/35 px-2.5 py-2 text-xs font-bold text-slate-400">
          <span>Ungrouped / No Group</span>
          <span className="rounded-full bg-slate-950 px-2 py-1 text-[11px] font-black">
            {
              combatants.filter(
                (combatant) =>
                  !combatant.combatGroupId ||
                  !combatGroups.some(
                    (group) => group.id === combatant.combatGroupId,
                  ),
              ).length
            }
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-dashed border-slate-700 p-2">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
          Create Group
        </p>
        <input
          className="mt-2 h-8 w-full rounded-md border border-slate-800 bg-slate-950 px-2 text-xs font-bold text-white outline-none focus:border-cyan-300"
          placeholder="Skeleton Patrol"
          value={newGroupName}
          onChange={(event) => setNewGroupName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              createGroup();
            }
          }}
        />
        <div
          aria-label="Choose combat group color"
          className="mt-2 grid grid-cols-4 gap-1"
          role="radiogroup"
        >
          {colorOptions.map((option) => {
            const selected = newGroupColor === option.color;

            return (
              <button
                aria-checked={selected}
                aria-label={`Use ${option.color}`}
                className={`flex h-8 items-center justify-center rounded-lg border bg-slate-950 transition ${
                  selected
                    ? "scale-[1.03] border-white shadow-[0_0_14px_rgba(255,255,255,0.22)]"
                    : "border-slate-800 hover:border-slate-500"
                }`}
                key={option.color}
                role="radio"
                title={option.color}
                type="button"
                onClick={() => setNewGroupColor(option.color)}
              >
                <span
                  className={`h-4 w-4 rounded-md ${option.className} ${
                    selected
                      ? "ring-2 ring-white/80 ring-offset-2 ring-offset-slate-950"
                      : ""
                  }`}
                />
              </button>
            );
          })}
        </div>
        <button
          className="mt-2 h-8 w-full rounded-md bg-cyan-300 px-2 text-[10px] font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!newGroupName.trim()}
          type="button"
          onClick={createGroup}
        >
          Create Group
        </button>
      </div>
    </div>
  );
}

function GroupAssignmentField({
  groups,
  value,
  onChange,
}: {
  groups: CombatGroup[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
      Group
      <select
        className="h-8 rounded-md border border-slate-700 bg-slate-950 px-2 text-xs font-semibold normal-case tracking-normal text-white outline-none focus:border-cyan-300"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="ungrouped">Ungrouped / No Group</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function AbilityScores({
  scores,
}: {
  scores: CreatureTemplate["abilityScores"];
}) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
      {Object.entries(scores).map(([ability, value]) => (
        <div
          className="rounded-lg border border-slate-800 bg-slate-900/55 px-2 py-1.5 text-center"
          key={ability}
        >
          <p className="text-[10px] font-black uppercase text-slate-500">
            {ability}
          </p>
          <p className="text-sm font-black text-slate-100">{value}</p>
        </div>
      ))}
    </div>
  );
}

function PreviewSection({
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
    <div className="mt-4">
      <h4 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {title}
      </h4>
      <div className="mt-2 grid gap-2">
        {items.slice(0, 3).map((item) => (
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
        {items.length > 3 ? (
          <p className="text-xs font-bold text-slate-500">
            + {items.length - 3} more {title.toLowerCase()}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function TextField({
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
        className="h-8 rounded-md border border-slate-700 bg-slate-950 px-2 text-xs font-semibold normal-case tracking-normal text-white outline-none focus:border-cyan-300"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function groupCombatantsByCombatGroup(
  combatants: EncounterCombatant[],
  combatGroups: CombatGroup[],
) {
  const groups = new Map<
    string,
    {
      color?: string;
      combatants: EncounterCombatant[];
      key: string;
      name: string;
    }
  >();

  combatants.forEach((combatant) => {
    const assignedGroup = combatGroups.find(
      (group) => group.id === combatant.combatGroupId,
    );
    const name =
      assignedGroup?.name ||
      combatant.combatGroupLabel ||
      combatant.groupLabel ||
      combatant.combatGroupColor ||
      "Ungrouped";
    const color = assignedGroup?.color ?? combatant.combatGroupColor ?? "None";
    const key = assignedGroup?.id ?? `${name}-${color}`;
    const existing = groups.get(key);

    if (existing) {
      existing.combatants.push(combatant);
      return;
    }

    groups.set(key, {
      color,
      combatants: [combatant],
      key,
      name,
    });
  });

  return [...groups.values()];
}

function getSelectedGroupValue(
  combatant: EncounterCombatant,
  groups: CombatGroup[],
) {
  if (combatant.combatGroupId) {
    return groups.some((group) => group.id === combatant.combatGroupId)
      ? combatant.combatGroupId
      : "ungrouped";
  }

  if (!combatant.combatGroupColor || combatant.combatGroupColor === "None") {
    return "ungrouped";
  }

  return (
    groups.find(
      (group) =>
        group.name === combatant.combatGroupLabel &&
        group.color === combatant.combatGroupColor,
    )?.id ?? "ungrouped"
  );
}

function countCombatantsInGroup(
  combatants: EncounterCombatant[],
  group: CombatGroup,
) {
  return combatants.filter(
    (combatant) => combatant.combatGroupId === group.id,
  ).length;
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

function getCampaignName(campaignId: string) {
  return (
    campaignOptions.find((campaign) => campaign.id === campaignId)?.name ??
    "Unassigned / No Campaign"
  );
}

function createNextWave(waves: EncounterWave[]): EncounterWave {
  const existingWaveNumbers = waves.map((wave) => {
    const match = wave.name.match(/^Wave (\d+)$/);
    return match ? Number(match[1]) : 0;
  });
  const nextNumber = Math.max(waves.length, ...existingWaveNumbers) + 1;

  return {
    deployed: false,
    id: `wave-${nextNumber}-${Date.now()}`,
    name: `Wave ${nextNumber}`,
  };
}
