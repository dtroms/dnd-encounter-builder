"use client";

import { useMemo, useState } from "react";
import type {
  CombatantType,
  CreatureTemplate,
  EncounterCombatant,
} from "@/lib/encounter/types";
import { accentColorOptions, combatantTypeOrder } from "@/lib/encounter/colors";
import { AddCombatantPanel } from "./add-combatant-panel";
import { EmptyState } from "./empty-state";
import { TypeBadge } from "./type-badge";

type EncounterBuilderProps = {
  combatants: EncounterCombatant[];
  templates: CreatureTemplate[];
  onAdd: (template: CreatureTemplate, count: number) => void;
  onDuplicate: (combatant: EncounterCombatant) => void;
  onRemove: (combatantId: string) => void;
  onUpdate: (combatantId: string, updates: Partial<EncounterCombatant>) => void;
  onLaunchRunner: () => void;
};

export function EncounterBuilder({
  combatants,
  templates,
  onAdd,
  onDuplicate,
  onRemove,
  onUpdate,
  onLaunchRunner,
}: EncounterBuilderProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | CombatantType>("all");

  const filteredTemplates = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesQuery =
        normalized.length === 0 ||
        template.name.toLowerCase().includes(normalized) ||
        template.type.includes(normalized) ||
        template.tags.some((tag) => tag.includes(normalized));
      const matchesType = typeFilter === "all" || template.type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [query, templates, typeFilter]);

  return (
    <div className="grid gap-3 xl:grid-cols-[15rem_minmax(0,1fr)_29rem]">
      <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
        <h2 className="text-base font-black text-white">Builder Controls</h2>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Search the sample library, add copies, and prep the roster before the
          fight starts.
        </p>
        <div className="mt-3 grid gap-2">
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
            Search
            <input
              className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-sm normal-case tracking-normal text-white outline-none focus:border-cyan-300"
              placeholder="Name, tag, type..."
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
            Type
            <select
              className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-sm normal-case tracking-normal text-white outline-none focus:border-cyan-300"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "all" | CombatantType)
              }
            >
              <option value="all">All types</option>
              {combatantTypeOrder.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <button
            className="mt-1 h-9 rounded-lg bg-amber-300 px-3 text-xs font-black text-slate-950 transition hover:bg-amber-200"
            type="button"
            onClick={onLaunchRunner}
          >
            Launch Runner
          </button>
        </div>
      </section>

      <AddCombatantPanel
        search={query}
        selectedType={typeFilter}
        templates={filteredTemplates}
        onAdd={onAdd}
        onSearchChange={setQuery}
        onTypeChange={setTypeFilter}
      />

      <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white">Encounter Roster</h2>
            <p className="text-xs text-slate-400">
              {combatants.length} combatants ready for initiative.
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-1.5">
          {combatants.length === 0 ? (
            <EmptyState
              detail="Add sample creatures from the center panel to start building."
              title="No roster yet"
            />
          ) : null}

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
      </section>
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
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/75 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TypeBadge type={combatant.type} />
        <div className="flex gap-2">
          <button
            className="h-7 rounded-md border border-slate-700 px-2 text-[11px] font-bold text-slate-300 hover:border-cyan-300"
            type="button"
            onClick={onDuplicate}
          >
            Duplicate
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
      <div className="mt-2 grid gap-1.5">
        <TextField
          label="Name"
          value={combatant.displayName}
          onChange={(displayName) => onUpdate({ displayName })}
        />
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Type"
            value={combatant.type}
            values={combatantTypeOrder}
            onChange={(type) =>
              onUpdate({
                type: type as CombatantType,
                autoRollEligible: type !== "pc",
              })
            }
          />
          <SelectField
            label="Accent"
            value={combatant.accentColor}
            values={accentColorOptions}
            onChange={(accentColor) => onUpdate({ accentColor })}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NumberField
            label="AC"
            value={combatant.armorClass}
            onChange={(armorClass) => onUpdate({ armorClass })}
          />
          <NumberField
            label="Max HP"
            value={combatant.maxHp}
            onChange={(maxHp) =>
              onUpdate({ maxHp, currentHp: Math.min(combatant.currentHp, maxHp) })
            }
          />
          <NumberField
            label="HP"
            value={combatant.currentHp}
            onChange={(currentHp) => onUpdate({ currentHp })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Init +"
            value={combatant.initiativeBonus}
            onChange={(initiativeBonus) => onUpdate({ initiativeBonus })}
          />
          <TextField
            label="Wave"
            value={combatant.waveLabel ?? ""}
            onChange={(waveLabel) => onUpdate({ waveLabel })}
          />
        </div>
        <TextField
          label="Group"
          value={combatant.groupLabel ?? ""}
          onChange={(groupLabel) => onUpdate({ groupLabel })}
        />
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

function NumberField({
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
        className="h-8 rounded-md border border-slate-700 bg-slate-950 px-2 text-xs font-semibold normal-case tracking-normal text-white outline-none focus:border-cyan-300"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
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
