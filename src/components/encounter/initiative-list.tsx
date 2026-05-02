"use client";

import type { EncounterCombatant } from "@/lib/encounter/types";
import type { StatBlockAction } from "@/lib/encounter/types";
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
  onNameChange: (combatantId: string, name: string) => void;
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
  onNameChange,
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
            owners={entry.combatants}
            selected={entry.combatants.some(
              (combatant) => combatant.combatantId === selectedCombatantId,
            )}
            onSelect={() => onSelect(entry.combatants[0]?.combatantId ?? "")}
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
            onNameChange={(name) =>
              onNameChange(entry.combatant.combatantId, name)
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
  owners,
  active,
  selected,
  onSelect,
}: {
  owners: EncounterCombatant[];
  active: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const actionCount = owners.reduce(
    (count, owner) => count + (owner.lairActions?.length ?? 0),
    0,
  );
  const title =
    owners.length === 1
      ? `${owners[0].displayName} - Lair Actions`
      : "Lair Actions";

  return (
    <button
      className={`relative rounded-xl border border-amber-400/30 bg-amber-400/10 py-1.5 pl-2 pr-4 text-left shadow-sm transition ${
        active ? "ring-2 ring-amber-300/50" : ""
      } ${selected ? "outline outline-2 outline-cyan-300/70" : ""}`}
      type="button"
      onClick={onSelect}
    >
      <div className="grid grid-cols-[4.5rem_minmax(10rem,1fr)_auto] items-center gap-1">
        <div className="rounded-lg border border-amber-300/40 bg-slate-950/80 px-1 py-2 text-center">
          <span className="block text-[10px] font-black uppercase tracking-wide text-amber-200">
            Init
          </span>
          <strong className="text-2xl font-black text-white">20</strong>
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-black text-amber-100">
            {title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {owners.length === 1 ? <TypeBadge type={owners[0].type} /> : null}
            <span className="rounded-full border border-amber-300/30 bg-slate-950 px-2 py-0.5 text-[11px] font-bold text-amber-100">
              Initiative 20
            </span>
            <span className="text-[11px] font-semibold text-slate-300">
              {actionCount} options
            </span>
          </div>
        </div>
        <span className="pr-2 text-xs font-bold text-slate-400">
          Select owner
        </span>
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
    </button>
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
