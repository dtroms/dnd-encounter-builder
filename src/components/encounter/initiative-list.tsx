"use client";

import { useState } from "react";
import type { CombatGroup, EncounterCombatant } from "@/lib/encounter/types";
import type { StatBlockAction } from "@/lib/encounter/types";
import { getHpStatus } from "@/lib/encounter/hp";
import {
  getInitiativeEntries,
  sortInitiativeEntries,
  type SyntheticInitiativeOverrides,
} from "@/lib/encounter/initiative";
import { CombatantCard } from "./combatant-card";
import { EmptyState } from "./empty-state";
import { TypeBadge } from "./type-badge";

export type RunnerFilter = "all" | "alive" | "enemies" | "pcs";

type InitiativeListProps = {
  combatants: EncounterCombatant[];
  combatGroups: CombatGroup[];
  filter: RunnerFilter;
  activeCombatantId: string | null;
  selectedEntryId: string | null;
  syntheticEntryOverrides: SyntheticInitiativeOverrides;
  onSelectEntry: (entryId: string, sourceCombatantId: string | null) => void;
  onRemove: (combatantId: string) => void;
  onDamage: (combatantId: string, amount: number) => void;
  onHealing: (combatantId: string, amount: number) => void;
  onInitiativeChange: (combatantId: string, initiative: number | null) => void;
  onNameChange: (combatantId: string, name: string) => void;
  onViewSheet?: (combatant: EncounterCombatant) => void;
  onSyntheticEntryNameChange: (entryId: string, name: string) => void;
  onSyntheticEntryInitiativeChange: (
    entryId: string,
    initiative: number | null,
  ) => void;
  onUpdateGroup: (
    combatantId: string,
    updates: { combatGroupLabel?: string; combatGroupColor?: string },
  ) => void;
};

export function InitiativeList({
  combatants,
  combatGroups,
  filter,
  activeCombatantId,
  selectedEntryId,
  syntheticEntryOverrides,
  onSelectEntry,
  onRemove,
  onDamage,
  onHealing,
  onInitiativeChange,
  onNameChange,
  onViewSheet,
  onSyntheticEntryNameChange,
  onSyntheticEntryInitiativeChange,
  onUpdateGroup,
}: InitiativeListProps) {
  const filteredCombatants = combatants.filter((combatant) => {
    if (filter === "alive") return getHpStatus(combatant.currentHp, combatant.maxHp) !== "Down";
    if (filter === "enemies") return combatant.type === "enemy" || combatant.type === "boss";
    if (filter === "pcs") return combatant.type === "pc";
    return true;
  });
  const ordered = sortInitiativeEntries(
    getInitiativeEntries(filteredCombatants, syntheticEntryOverrides),
  );

  if (ordered.length === 0) {
    return (
      <EmptyState
        detail="Add combatants or adjust the runner filter to see cards here."
        title="No combatants in this view"
      />
    );
  }

  return (
    <div className="grid gap-1.5">
      {ordered.map((entry) =>
        entry.kind === "lair" ? (
          <LairActionRow
            active={entry.id === activeCombatantId}
            initiative={entry.initiative}
            key={entry.id}
            name={entry.displayName}
            owners={entry.combatants}
            selected={entry.id === selectedEntryId}
            onInitiativeChange={(initiative) =>
              onSyntheticEntryInitiativeChange(entry.id, initiative)
            }
            onNameChange={(name) => onSyntheticEntryNameChange(entry.id, name)}
            onSelect={() =>
              onSelectEntry(entry.id, entry.combatants[0]?.combatantId ?? null)
            }
          />
        ) : (
          <CombatantCard
            active={entry.id === activeCombatantId}
            combatant={entry.combatant}
            combatGroups={combatGroups}
            key={entry.id}
            selected={entry.id === selectedEntryId}
            onDamage={(amount) => onDamage(entry.combatant.combatantId, amount)}
            onHealing={(amount) => onHealing(entry.combatant.combatantId, amount)}
            onInitiativeChange={(initiative) =>
              onInitiativeChange(entry.combatant.combatantId, initiative)
            }
            onNameChange={(name) =>
              onNameChange(entry.combatant.combatantId, name)
            }
            onRemove={() => onRemove(entry.combatant.combatantId)}
            onSelect={() =>
              onSelectEntry(entry.id, entry.combatant.combatantId)
            }
            onViewSheet={() => onViewSheet?.(entry.combatant)}
            onUpdateGroup={(updates) =>
              onUpdateGroup(entry.combatant.combatantId, updates)
            }
          />
        ),
      )}
    </div>
  );
}

function LairActionRow({
  initiative,
  name,
  owners,
  active,
  selected,
  onInitiativeChange,
  onNameChange,
  onSelect,
}: {
  initiative: number;
  name: string;
  owners: EncounterCombatant[];
  active: boolean;
  selected: boolean;
  onInitiativeChange: (initiative: number | null) => void;
  onNameChange: (name: string) => void;
  onSelect: () => void;
}) {
  const actionCount = owners.reduce(
    (count, owner) => count + (owner.lairActions?.length ?? 0),
    0,
  );

  return (
    <article
      className={`relative rounded-xl border border-amber-400/30 bg-amber-400/10 py-1.5 pl-2 pr-4 text-left shadow-sm transition-all duration-200 ease-out ${
        active
          ? "z-20 -my-1.5 scale-[1.02] border-amber-200/75 shadow-[0_18px_36px_rgba(69,26,3,0.58)] ring-2 ring-amber-300/55"
          : "z-0"
      } ${selected ? "outline outline-1 outline-cyan-300/55" : ""}`}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-2">
        <SyntheticInitiativeBox
          initiative={initiative}
          onInitiativeChange={onInitiativeChange}
        />
        <div className="min-w-0">
          <EditableSyntheticName
            defaultName={owners.length === 1
              ? `${owners[0].displayName} - Lair Actions`
              : "Lair Actions"}
            name={name}
            onNameChange={onNameChange}
          />
          <div className="mt-1 grid grid-cols-[1fr_auto] items-center gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {owners.length === 1 ? <TypeBadge type={owners[0].type} /> : null}
              <span className="rounded-full border border-amber-300/30 bg-slate-950 px-2 py-0.5 text-[11px] font-bold text-amber-100">
                Initiative 20
              </span>
              <span className="text-[11px] font-semibold text-slate-300">
                {actionCount} options
              </span>
            </div>
            <span className="pr-2 text-xs font-bold text-slate-400">
              Select owner
            </span>
          </div>
        </div>
      </div>

      {owners.length > 0 ? (
        <section className="mt-2 rounded-lg border border-amber-300/20 bg-slate-950/70 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-black uppercase tracking-[0.16em] text-amber-100">
              Lair Actions
            </h4>
            <span className="truncate text-xs font-bold text-amber-100/80">
              {owners.length === 1
                ? `Source: ${owners[0].displayName}`
                : `${owners.length} sources`}
            </span>
          </div>
          <div className="mt-2 grid gap-2">
            {owners.map((owner) => (
              <div key={owner.combatantId}>
                {owners.length > 1 ? (
                  <p className="mb-1.5 text-sm font-black text-amber-100">
                    {owner.displayName}
                  </p>
                ) : null}
                <ActionCardGrid actions={owner.lairActions ?? []} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="absolute inset-y-0 right-0 w-2.5 rounded-r-xl bg-amber-300" />
    </article>
  );
}

function ActionCardGrid({ actions }: { actions: StatBlockAction[] }) {
  return (
    <div className="mt-2 grid gap-2 md:grid-cols-2">
      {actions.map((action) => (
        <div
          className="rounded-lg border border-amber-300/15 bg-slate-900/90 p-2.5"
          key={action.name}
        >
          <p className="text-sm font-black text-amber-100">{action.name}</p>
          <p className="mt-1 text-sm leading-5 text-slate-300">
            {action.description}
          </p>
        </div>
      ))}
    </div>
  );
}

function SyntheticInitiativeBox({
  initiative,
  onInitiativeChange,
}: {
  initiative: number;
  onInitiativeChange: (initiative: number | null) => void;
}) {
  const [draft, setDraft] = useState(String(initiative));

  function commitInitiative() {
    const trimmed = draft.trim();
    onInitiativeChange(trimmed === "" ? null : Number(trimmed));
  }

  return (
    <div
      className="rounded-lg border border-amber-300/60 bg-slate-950 px-1 py-2 text-center shadow-[0_0_18px_rgba(251,191,36,0.2)] ring-1 ring-amber-100/10"
      onClick={(event) => event.stopPropagation()}
    >
      <span className="block text-[10px] font-black uppercase tracking-wide text-amber-200">
        Init
      </span>
      <input
        aria-label="Lair action initiative"
        className="no-spinner h-8 w-full bg-transparent px-1 text-center text-xl font-black leading-none tabular-nums text-white outline-none focus:text-amber-100"
        inputMode="numeric"
        type="text"
        value={draft}
        onBlur={commitInitiative}
        onChange={(event) =>
          setDraft(event.target.value.replace(/[^\d-]/g, ""))
        }
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
      />
    </div>
  );
}

function EditableSyntheticName({
  name,
  defaultName,
  onNameChange,
}: {
  name: string;
  defaultName: string;
  onNameChange: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name || defaultName);

  function saveName() {
    const trimmed = draft.trim();
    if (trimmed) {
      onNameChange(trimmed);
    } else {
      setDraft(name || defaultName);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        aria-label="Edit lair action row name"
        autoFocus
        className="h-8 w-full rounded-md border border-amber-300/60 bg-slate-950/90 px-1.5 text-xl font-black leading-none text-white outline-none focus:border-amber-300"
        value={draft}
        onBlur={saveName}
        onChange={(event) => setDraft(event.target.value)}
        onClick={(event) => event.stopPropagation()}
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            setDraft(name || defaultName);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      className="block max-w-full rounded-md text-left text-xl font-black leading-none text-white outline-none transition hover:text-amber-50 focus-visible:ring-2 focus-visible:ring-amber-300/50"
      title="Click to rename"
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        setDraft(name || defaultName);
        setEditing(true);
      }}
    >
      {name || defaultName}
    </button>
  );
}
