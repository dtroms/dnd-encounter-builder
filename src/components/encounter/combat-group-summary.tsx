"use client";

import { useState } from "react";
import type { CombatGroup, EncounterCombatant } from "@/lib/encounter/types";
import {
  combatGroupOptions,
  getCombatGroupColorClass,
} from "@/lib/encounter/colors";

type CombatGroupSummaryProps = {
  combatGroups: CombatGroup[];
  combatants: EncounterCombatant[];
  onCreateGroup: (group: { name: string; color: string }) => void;
  onRenameGroup: (group: {
    label: string;
    color?: string;
    newLabel: string;
  }) => void;
  onClearGroup: (group: { label: string; color?: string }) => void;
};

export function CombatGroupSummary({
  combatGroups,
  combatants,
  onCreateGroup,
  onRenameGroup,
  onClearGroup,
}: CombatGroupSummaryProps) {
  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("Red");
  const groupCounts = combatGroups.reduce<Record<string, number>>((acc, group) => {
    acc[group.id] = combatants.filter(
      (combatant) =>
        combatant.combatGroupLabel === group.name &&
        combatant.combatGroupColor === group.color,
    ).length;

    return acc;
  }, {});
  const ungroupedCount = combatants.filter(
    (combatant) =>
      !combatant.combatGroupColor || combatant.combatGroupColor === "None",
  ).length;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/75 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="panel-heading">Combat Groups</h3>
        <span className="text-[11px] font-bold text-slate-500">
          {combatGroups.length}
        </span>
      </div>
      <div className="mt-2 grid gap-1.5">
        {combatGroups.map((group) => {
          const colorClass =
            getCombatGroupColorClass(group.color) ?? "bg-slate-600";

          return (
            <div
              className="grid grid-cols-[1fr_auto_auto] items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/65 p-1.5"
              key={group.id}
            >
              <label className="flex min-w-0 items-center gap-1.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${colorClass}`} />
                <input
                  aria-label={`Rename ${group.name}`}
                  className="h-7 min-w-0 flex-1 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs font-black text-white outline-none focus:border-cyan-300"
                  value={group.name}
                  onChange={(event) => {
                    const newLabel = event.target.value.trim();
                    if (newLabel) {
                      onRenameGroup({
                        label: group.name,
                        color: group.color,
                        newLabel,
                      });
                    }
                  }}
                  onBlur={(event) => {
                    const newLabel = event.target.value.trim();
                    if (!newLabel) {
                      onRenameGroup({
                        label: group.name,
                        color: group.color,
                        newLabel: "Unnamed Group",
                      });
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
                {groupCounts[group.id] ?? 0}
              </span>
              <button
                className="h-7 rounded-md border border-slate-700 px-1.5 text-[10px] font-black text-slate-400 hover:border-rose-400 hover:text-rose-200"
                type="button"
                onClick={() => onClearGroup({ label: group.name, color: group.color })}
              >
                Clear
              </button>
            </div>
          );
        })}
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/35 p-1.5 text-xs font-bold text-slate-400">
          <span>Ungrouped / No Group</span>
          <span className="rounded-full bg-slate-950 px-2 py-1 text-[11px] font-black">
            {ungroupedCount}
          </span>
        </div>
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
                onCreateGroup({
                  name: newGroupLabel.trim(),
                  color: newGroupColor,
                });
                setNewGroupLabel("");
              }}
            >
              Create
            </button>
          </div>
          <p className="text-[10px] leading-4 text-slate-500">
            New groups become available in each row&apos;s group menu.
          </p>
        </div>
      </div>
    </section>
  );
}
