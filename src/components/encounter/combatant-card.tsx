"use client";

import { useState } from "react";
import type { EncounterCombatant } from "@/lib/encounter/types";
import type { StatBlockAction } from "@/lib/encounter/types";
import {
  getCombatGroupColorClass,
  getCombatGroupRowStyle,
  typeStyles,
} from "@/lib/encounter/colors";
import { getHpPercent, getHpStatus } from "@/lib/encounter/hp";
import { CombatGroupPicker } from "./combat-group-picker";
import { HpControls } from "./hp-controls";
import { StatusBadge } from "./status-badge";
import { TypeBadge } from "./type-badge";

type CombatantCardProps = {
  combatant: EncounterCombatant;
  active: boolean;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDamage: (amount: number) => void;
  onHealing: (amount: number) => void;
  onInitiativeChange: (initiative: number | null) => void;
  onNameChange: (name: string) => void;
  onUpdateGroup: (updates: {
    combatGroupLabel?: string;
    combatGroupColor?: string;
  }) => void;
};

export function CombatantCard({
  combatant,
  active,
  selected,
  onSelect,
  onRemove,
  onDamage,
  onHealing,
  onInitiativeChange,
  onNameChange,
  onUpdateGroup,
}: CombatantCardProps) {
  const status = getHpStatus(combatant.currentHp, combatant.maxHp);
  const hpPercent = getHpPercent(combatant.currentHp, combatant.maxHp);
  const style = typeStyles[combatant.type];
  const groupColorClass = getCombatGroupColorClass(combatant.combatGroupColor);
  const groupRowStyle = getCombatGroupRowStyle(combatant.combatGroupColor);
  const down = status === "Down";
  const isBoss = combatant.type === "boss";
  const legendaryActions = combatant.legendaryActions ?? [];
  return (
    <article
      className={`relative rounded-xl border py-1.5 pl-2 pr-0 shadow-sm transition ${groupRowStyle.rowTint} ${
        isBoss ? `${groupRowStyle.border} shadow-amber-950/10` : groupRowStyle.border
      } ${
        active ? `ring-2 ${style.ring}` : ""
      } ${selected ? "outline outline-2 outline-cyan-300/70" : ""} ${
        down ? "opacity-60 grayscale" : ""
      }`}
      onClick={onSelect}
    >
      {active ? (
        <div className="absolute inset-y-0 left-0 w-1.5 bg-cyan-300" />
      ) : null}
      <div
        className={`absolute inset-y-0 right-0 w-2.5 rounded-r-xl ${groupColorClass ?? style.dot}`}
      />
      <div className="grid grid-cols-[4.5rem_minmax(9rem,0.72fr)_3rem_16.25rem_4.25rem] items-center gap-1 pr-3">
        <InitiativeBox
          key={`${combatant.combatantId}-${combatant.initiative ?? "unset"}`}
          combatantName={combatant.displayName}
          initiative={combatant.initiative}
          onInitiativeChange={onInitiativeChange}
        />

        <div className="min-w-0 cursor-pointer text-left">
          <EditableCombatantName
            name={combatant.displayName}
            onNameChange={onNameChange}
          />
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <TypeBadge type={combatant.type} />
          </div>
        </div>

        <div className="cursor-pointer text-left">
          <span className="block text-[10px] font-black uppercase tracking-wide text-slate-500">
            AC
          </span>
          <strong className="text-2xl font-black text-white">
            {combatant.armorClass}
          </strong>
        </div>

        <div className="grid grid-cols-[8.25rem_1fr] items-center gap-1">
          <div className="cursor-pointer text-left">
            <span className="block text-[10px] font-black uppercase tracking-wide text-slate-500">
              HP
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <strong className="text-lg font-black text-white">
                {combatant.currentHp}/{combatant.maxHp}
              </strong>
              <span className="text-xs font-bold text-slate-500">
                {hpPercent}%
              </span>
            </div>
            <div className="mt-0.5">
              <StatusBadge status={status} />
            </div>
          </div>
          <div onClick={(event) => event.stopPropagation()}>
            <HpControls
              currentHp={combatant.currentHp}
              maxHp={combatant.maxHp}
              onDamage={onDamage}
              onHealing={onHealing}
            />
          </div>
        </div>

        <div
          className="grid grid-cols-[2rem_2rem] items-center justify-end"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            aria-label={`Remove ${combatant.displayName}`}
            className="h-9 w-8 rounded-l-lg border border-slate-700 bg-slate-950/75 px-2 text-sm font-black text-slate-300 transition hover:border-rose-400 hover:text-rose-200"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
          >
            X
          </button>
          <CombatGroupPicker
            combatant={combatant}
            variant="menu"
            onUpdateGroup={onUpdateGroup}
          />
        </div>
      </div>

      {isBoss && legendaryActions.length > 0 ? (
        <BossActionSection
          actions={legendaryActions}
          title="Legendary Actions"
        />
      ) : null}

    </article>
  );
}

function BossActionSection({
  title,
  actions,
}: {
  title: string;
  actions: StatBlockAction[];
}) {
  const accentClasses = {
    section: "border-slate-700/80 bg-slate-950/70",
    title: "text-amber-200/85",
    card: "border-slate-800 bg-slate-900/90",
    action: "text-amber-100",
  };

  return (
    <section
      className={`ml-0 mr-4 mt-1.5 rounded-lg border p-2.5 ${accentClasses.section}`}
    >
      <h4
        className={`text-xs font-black uppercase tracking-[0.16em] ${accentClasses.title}`}
      >
        {title}
      </h4>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {actions.map((action) => (
          <div
            className={`rounded-lg border p-2.5 ${accentClasses.card}`}
            key={action.name}
          >
            <p className={`text-sm font-black ${accentClasses.action}`}>
              {action.name}
            </p>
            <p className="mt-1 text-sm leading-5 text-slate-300">
              {action.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function InitiativeBox({
  combatantName,
  initiative,
  onInitiativeChange,
}: {
  combatantName: string;
  initiative: number | null;
  onInitiativeChange: (initiative: number | null) => void;
}) {
  const [draft, setDraft] = useState(initiative === null ? "" : String(initiative));

  function commitInitiative() {
    const trimmed = draft.trim();
    onInitiativeChange(trimmed === "" ? null : Number(trimmed));
  }

  return (
    <div
      className="rounded-lg border border-slate-700 bg-slate-950/80 px-1 py-2 text-center"
      onClick={(event) => event.stopPropagation()}
    >
      <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">
        Init
      </span>
      <input
        aria-label={`${combatantName} initiative`}
        className="no-spinner h-8 w-full bg-transparent px-1 text-center text-2xl font-black leading-none tabular-nums text-white outline-none focus:text-cyan-100"
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

function EditableCombatantName({
  name,
  onNameChange,
}: {
  name: string;
  onNameChange: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  function saveName() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) {
      onNameChange(trimmed);
    } else {
      setDraft(name);
    }
    setEditing(false);
  }

  function cancelEdit() {
    setDraft(name);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        aria-label="Edit combatant name"
        autoFocus
        className="h-7 w-full rounded-md border border-cyan-300/50 bg-slate-950/85 px-1.5 text-base font-black text-white outline-none focus:border-cyan-300"
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
            cancelEdit();
          }
        }}
      />
    );
  }

  return (
    <button
      className="block max-w-full truncate rounded-md text-left text-base font-black text-white outline-none transition hover:text-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-300/50"
      title="Click to rename"
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        setDraft(name);
        setEditing(true);
      }}
    >
      {name}
    </button>
  );
}
