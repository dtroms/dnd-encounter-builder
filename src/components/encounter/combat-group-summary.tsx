"use client";

import { useState } from "react";
import type { EncounterCombatant } from "@/lib/encounter/types";
import {
  combatGroupOptions,
  getCombatGroupColorClass,
} from "@/lib/encounter/colors";

type CombatGroupSummaryProps = {
  combatants: EncounterCombatant[];
  onRenameGroup: (group: {
    label: string;
    color?: string;
    newLabel: string;
  }) => void;
  onClearGroup: (group: { label: string; color?: string }) => void;
};

export function CombatGroupSummary({
  combatants,
  onRenameGroup,
  onClearGroup,
}: CombatGroupSummaryProps) {
  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("Red");
  const groups = combatants.reduce<Record<string, { color?: string; count: number }>>(
    (acc, combatant) => {
      const hasGroup =
        combatant.combatGroupColor && combatant.combatGroupColor !== "None";
      const label = hasGroup
        ? combatant.combatGroupLabel || combatant.combatGroupColor || "Grouped"
        : "Ungrouped";

      acc[label] = {
        color: hasGroup ? combatant.combatGroupColor : "None",
        count: (acc[label]?.count ?? 0) + 1,
      };

      return acc;
    },
    {},
  );

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/75 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="panel-heading">Combat Groups</h3>
        <span className="text-[11px] font-bold text-slate-500">
          {Object.keys(groups).length}
        </span>
      </div>
      <div className="mt-2 grid gap-1.5">
        {Object.entries(groups).map(([label, group]) => {
          const colorClass =
            getCombatGroupColorClass(group.color) ?? "bg-slate-600";

          return (
            <div
              className="grid grid-cols-[1fr_auto_auto] items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/65 p-1.5"
              key={label}
            >
              <label className="flex min-w-0 items-center gap-1.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${colorClass}`} />
                <input
                  aria-label={`Rename ${label}`}
                  className="h-7 min-w-0 flex-1 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs font-black text-white outline-none focus:border-cyan-300"
                  defaultValue={label}
                  onBlur={(event) => {
                    const newLabel = event.target.value.trim();
                    if (newLabel && newLabel !== label) {
                      onRenameGroup({ label, color: group.color, newLabel });
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }
                  }}
                />
              </label>
              <span className="rounded-full bg-slate-950 px-2 py-1 text-[11px] font-black text-slate-400">
                {group.count}
              </span>
              <button
                className="h-7 rounded-md border border-slate-700 px-1.5 text-[10px] font-black text-slate-400 hover:border-rose-400 hover:text-rose-200"
                type="button"
                onClick={() => onClearGroup({ label, color: group.color })}
              >
                Clear
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-2 border-t border-slate-800 pt-2">
        <div className="grid gap-1 rounded-lg border border-dashed border-slate-700 p-1.5">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
            Create Named Group
          </p>
          <input
            className="h-7 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs font-bold text-white outline-none focus:border-cyan-300"
            placeholder="e.g. Skullfang Warband"
            value={newGroupLabel}
            onChange={(event) => setNewGroupLabel(event.target.value)}
          />
          <div className="grid grid-cols-[1fr_auto] gap-1">
            <select
              className="h-7 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs font-bold text-white outline-none focus:border-cyan-300"
              value={newGroupColor}
              onChange={(event) => setNewGroupColor(event.target.value)}
            >
              {combatGroupOptions
                .filter((option) => option.color !== "None")
                .map((option) => (
                  <option key={option.color} value={option.color}>
                    {option.color}
                  </option>
                ))}
            </select>
            <button
              className="h-7 rounded-md bg-cyan-300 px-2 text-[10px] font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              disabled={!newGroupLabel.trim()}
              onClick={() => {
                onRenameGroup({
                  label: newGroupColor,
                  color: newGroupColor,
                  newLabel: newGroupLabel.trim(),
                });
                setNewGroupLabel("");
              }}
            >
              Create
            </button>
          </div>
          <p className="text-[10px] leading-4 text-slate-500">
            Creates the name when combatants already use that color. Assign
            colors from the selected combatant card above.
          </p>
        </div>
      </div>
    </section>
  );
}
