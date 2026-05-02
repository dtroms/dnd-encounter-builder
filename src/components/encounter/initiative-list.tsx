"use client";

import type { EncounterCombatant } from "@/lib/encounter/types";
import { getHpStatus } from "@/lib/encounter/hp";
import {
  getInitiativeEntries,
  sortInitiativeEntries,
} from "@/lib/encounter/initiative";
import { CombatantCard } from "./combatant-card";
import { EmptyState } from "./empty-state";
import { TypeBadge } from "./type-badge";

export type RunnerFilter = "all" | "alive" | "enemies" | "pcs";

type InitiativeListProps = {
  combatants: EncounterCombatant[];
  filter: RunnerFilter;
  activeCombatantId: string | null;
  selectedCombatantId: string | null;
  onSelect: (combatantId: string) => void;
  onRemove: (combatantId: string) => void;
  onDamage: (combatantId: string, amount: number) => void;
  onHealing: (combatantId: string, amount: number) => void;
  onInitiativeChange: (combatantId: string, initiative: number | null) => void;
  onUpdateGroup: (
    combatantId: string,
    updates: { combatGroupLabel?: string; combatGroupColor?: string },
  ) => void;
};

export function InitiativeList({
  combatants,
  filter,
  activeCombatantId,
  selectedCombatantId,
  onSelect,
  onRemove,
  onDamage,
  onHealing,
  onInitiativeChange,
  onUpdateGroup,
}: InitiativeListProps) {
  const filteredCombatants = combatants.filter((combatant) => {
    if (filter === "alive") return getHpStatus(combatant.currentHp, combatant.maxHp) !== "Down";
    if (filter === "enemies") return combatant.type === "enemy" || combatant.type === "boss";
    if (filter === "pcs") return combatant.type === "pc";
    return true;
  });
  const ordered = sortInitiativeEntries(getInitiativeEntries(filteredCombatants));

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
            key={entry.id}
            owner={entry.combatant}
            selected={entry.combatant.combatantId === selectedCombatantId}
            onSelect={() => onSelect(entry.combatant.combatantId)}
          />
        ) : (
          <CombatantCard
            active={entry.id === activeCombatantId}
            combatant={entry.combatant}
            key={entry.id}
            selected={entry.combatant.combatantId === selectedCombatantId}
            onDamage={(amount) => onDamage(entry.combatant.combatantId, amount)}
            onHealing={(amount) => onHealing(entry.combatant.combatantId, amount)}
            onInitiativeChange={(initiative) =>
              onInitiativeChange(entry.combatant.combatantId, initiative)
            }
            onRemove={() => onRemove(entry.combatant.combatantId)}
            onSelect={() => onSelect(entry.combatant.combatantId)}
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
  owner,
  active,
  selected,
  onSelect,
}: {
  owner: EncounterCombatant;
  active: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`relative grid items-center gap-1 overflow-hidden rounded-xl border border-amber-400/30 bg-amber-400/10 py-1.5 pl-2 pr-0 text-left shadow-sm transition xl:grid-cols-[4.5rem_minmax(10rem,1fr)_auto_0.6rem] ${
        active ? "ring-2 ring-amber-300/50" : ""
      } ${selected ? "outline outline-2 outline-cyan-300/70" : ""}`}
      type="button"
      onClick={onSelect}
    >
      <div className="rounded-lg border border-amber-300/40 bg-slate-950/80 px-1 py-2 text-center">
        <span className="block text-[10px] font-black uppercase tracking-wide text-amber-200">
          Init
        </span>
        <strong className="text-2xl font-black text-white">20</strong>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-amber-100">
          {owner.displayName} - Lair Action
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <TypeBadge type={owner.type} />
          <span className="rounded-full border border-amber-300/30 bg-slate-950 px-2 py-0.5 text-[11px] font-bold text-amber-100">
            Initiative 20
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            {owner.lairActions?.length ?? 0} options
          </span>
        </div>
      </div>
      <span className="pr-2 text-xs font-bold text-slate-400">
        Select owner
      </span>
      <div className="h-full min-h-14 w-full bg-amber-300" />
    </button>
  );
}
