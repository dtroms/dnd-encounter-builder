"use client";

import { useMemo, useState } from "react";
import type {
  CombatantType,
  CreatureTemplate,
  EncounterCombatant,
  StatBlockAction,
  StatBlockTrait,
} from "@/lib/encounter/types";
import {
  accentColorOptions,
  combatantTypeOrder,
  getCombatGroupColorClass,
} from "@/lib/encounter/colors";
import { EmptyState } from "./empty-state";
import { TypeBadge } from "./type-badge";

type EncounterBuilderProps = {
  combatants: EncounterCombatant[];
  encounterName?: string;
  templates: CreatureTemplate[];
  onAdd: (template: CreatureTemplate, count: number) => void;
  onDuplicate: (combatant: EncounterCombatant) => void;
  onRemove: (combatantId: string) => void;
  onUpdate: (combatantId: string, updates: Partial<EncounterCombatant>) => void;
  onLaunchRunner: () => void;
};

type TypeFilter = "all" | CombatantType;

const quickFilters: Array<{ label: string; value: TypeFilter }> = [
  { label: "All", value: "all" },
  { label: "PC", value: "pc" },
  { label: "Enemy", value: "enemy" },
  { label: "Boss", value: "boss" },
  { label: "NPC", value: "neutral" },
  { label: "Ally", value: "ally" },
  { label: "Summon", value: "summon" },
  { label: "Neutral", value: "neutral" },
];

const futureTaxonomy = [
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
];

export function EncounterBuilder({
  combatants,
  encounterName = "Lantern Alley Ambush",
  templates,
  onAdd,
  onDuplicate,
  onRemove,
  onUpdate,
  onLaunchRunner,
}: EncounterBuilderProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [crMin, setCrMin] = useState("");
  const [crMax, setCrMax] = useState("");
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(
    templates[3]?.id ?? templates[0]?.id ?? null,
  );
  const [addCounts, setAddCounts] = useState<Record<string, number>>({});

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
        template.type,
        template.size,
        template.challengeRating ?? "",
        ...template.tags,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalized.length === 0 || searchable.includes(normalized);
      const matchesType = typeFilter === "all" || template.type === typeFilter;
      const matchesSize = sizeFilter === "all" || template.size === sizeFilter;
      const matchesMin = minCr === null || templateCr === null || templateCr >= minCr;
      const matchesMax = maxCr === null || templateCr === null || templateCr <= maxCr;

      return matchesQuery && matchesType && matchesSize && matchesMin && matchesMax;
    });
  }, [crMax, crMin, query, sizeFilter, templates, typeFilter]);

  const groupedCombatants = useMemo(
    () => groupCombatantsByCombatGroup(combatants),
    [combatants],
  );
  const groupCount = groupedCombatants.length;
  const bossCount = combatants.filter((combatant) => combatant.type === "boss").length;
  const hasLairActions = combatants.some(
    (combatant) => combatant.lairActions && combatant.lairActions.length > 0,
  );

  function addCopies(template: CreatureTemplate, count = 1) {
    onAdd(template, count);
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
          query={query}
          sizeFilter={sizeFilter}
          sizes={availableSizes}
          typeFilter={typeFilter}
          onCrMaxChange={setCrMax}
          onCrMinChange={setCrMin}
          onQueryChange={setQuery}
          onReset={() => {
            setQuery("");
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                Current Encounter
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                {encounterName}
              </h2>
            </div>
            <button
              className="rounded-lg bg-amber-300 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-amber-200"
              type="button"
              onClick={onLaunchRunner}
            >
              Launch Runner
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <SummaryPill label="Combatants" value={String(combatants.length)} />
            <SummaryPill label="Groups" value={String(groupCount)} />
            <SummaryPill label="Bosses" value={bossCount > 0 ? String(bossCount) : "None"} />
            <SummaryPill label="Lair" value={hasLairActions ? "Ready" : "None"} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="cursor-not-allowed rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-black text-slate-500"
              disabled
              type="button"
            >
              Save Draft later
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-black text-white">Combat Groups</h3>
            <span className="text-xs font-bold text-slate-500">
              Group editing expands later
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {groupedCombatants.map((group) => (
              <span
                className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-black text-slate-300"
                key={`${group.name}-${group.color}`}
              >
                <span
                  className={`mr-1.5 inline-block h-2 w-2 rounded-full align-middle ${getCombatGroupColorClass(group.color) ?? "bg-slate-500"}`}
                />
                {group.name} ({group.combatants.length})
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <h3 className="text-base font-black text-white">Encounter Roster</h3>
          <div className="mt-3 space-y-3">
            {combatants.length === 0 ? (
              <EmptyState
                detail="Add creatures from the browser to start building."
                title="No roster yet"
              />
            ) : null}

            {groupedCombatants.map((group) => (
              <RosterGroup
                color={group.color}
                combatants={group.combatants}
                key={`${group.name}-${group.color}`}
                name={group.name}
                onDuplicate={onDuplicate}
                onRemove={onRemove}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-black text-white">
              Waves / Reinforcements
            </h3>
            <button
              className="cursor-not-allowed rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-black text-slate-500"
              disabled
              type="button"
            >
              Add Wave later
            </button>
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
            Prepare creatures to deploy during the Runner. Full wave editing comes
            in a later pass.
          </p>
        </section>
      </aside>
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
      <details className="relative">
        <summary className="cursor-pointer rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-black text-slate-300 hover:border-slate-500 hover:text-white">
          More Types later
        </summary>
        <div className="absolute z-10 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-950 p-3 shadow-2xl shadow-black/40">
          <p className="text-xs font-semibold leading-5 text-slate-500">
            Future taxonomy filters:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {futureTaxonomy.map((item) => (
              <span
                className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] font-bold text-slate-500"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}

function BrowserFilters({
  crMax,
  crMin,
  query,
  sizeFilter,
  sizes,
  typeFilter,
  onCrMaxChange,
  onCrMinChange,
  onQueryChange,
  onReset,
  onSizeFilterChange,
  onTypeFilterChange,
}: {
  crMax: string;
  crMin: string;
  query: string;
  sizeFilter: string;
  sizes: string[];
  typeFilter: TypeFilter;
  onCrMaxChange: (value: string) => void;
  onCrMinChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onReset: () => void;
  onSizeFilterChange: (value: string) => void;
  onTypeFilterChange: (value: TypeFilter) => void;
}) {
  return (
    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/55 p-3">
      <div className="grid gap-2 lg:grid-cols-[minmax(12rem,1fr)_8rem_7rem_7rem_8rem_auto]">
        <input
          aria-label="Search creatures"
          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
          placeholder="Search name, tag, role..."
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <select
          aria-label="Role filter"
          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-semibold text-white outline-none focus:border-cyan-300"
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value as TypeFilter)}
        >
          <option value="all">All roles</option>
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
          {template.size}
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
  name,
  onDuplicate,
  onRemove,
  onUpdate,
}: {
  color?: string;
  combatants: EncounterCombatant[];
  name: string;
  onDuplicate: (combatant: EncounterCombatant) => void;
  onRemove: (combatantId: string) => void;
  onUpdate: (combatantId: string, updates: Partial<EncounterCombatant>) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${getCombatGroupColorClass(color) ?? "bg-slate-500"}`}
        />
        <h4 className="text-xs font-black text-slate-300">{name}</h4>
        <span className="text-[11px] font-bold text-slate-600">
          {combatants.length}
        </span>
      </div>
      <div className="grid gap-1.5">
        {combatants.map((combatant) => (
          <RosterEditor
            combatant={combatant}
            key={combatant.combatantId}
            onDuplicate={() => onDuplicate(combatant)}
            onRemove={() => onRemove(combatant.combatantId)}
            onUpdate={(updates) => onUpdate(combatant.combatantId, updates)}
          />
        ))}
      </div>
    </div>
  );
}

function RosterEditor({
  combatant,
  onDuplicate,
  onRemove,
  onUpdate,
}: {
  combatant: EncounterCombatant;
  onDuplicate: () => void;
  onRemove: () => void;
  onUpdate: (updates: Partial<EncounterCombatant>) => void;
}) {
  const groupColor = combatant.combatGroupColor ?? combatant.accentColor;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/65 p-2">
      <div className="flex items-start gap-2">
        <span
          className={`mt-1 h-9 w-1 shrink-0 rounded-full ${getCombatGroupColorClass(groupColor) ?? "bg-slate-500"}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={combatant.type} />
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
            <SelectField
              label="Group Color"
              value={groupColor}
              values={["None", ...accentColorOptions]}
              onChange={(combatGroupColor) => onUpdate({ combatGroupColor })}
            />
            <TextField
              label="Group Name"
              value={combatant.combatGroupLabel ?? combatant.groupLabel ?? ""}
              onChange={(combatGroupLabel) => onUpdate({ combatGroupLabel })}
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

function SelectField({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
      {label}
      <select
        className="h-8 rounded-md border border-slate-700 bg-slate-950 px-2 text-xs font-semibold normal-case tracking-normal text-white outline-none focus:border-cyan-300"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {values.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

function groupCombatantsByCombatGroup(combatants: EncounterCombatant[]) {
  const groups = new Map<
    string,
    {
      color?: string;
      combatants: EncounterCombatant[];
      name: string;
    }
  >();

  combatants.forEach((combatant) => {
    const name =
      combatant.combatGroupLabel ||
      combatant.groupLabel ||
      combatant.combatGroupColor ||
      "Ungrouped";
    const color = combatant.combatGroupColor ?? combatant.accentColor;
    const key = `${name}-${color}`;
    const existing = groups.get(key);

    if (existing) {
      existing.combatants.push(combatant);
      return;
    }

    groups.set(key, {
      color,
      combatants: [combatant],
      name,
    });
  });

  return [...groups.values()];
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
