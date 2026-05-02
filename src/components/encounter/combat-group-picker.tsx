"use client";

import { useState } from "react";
import type { EncounterCombatant } from "@/lib/encounter/types";
import {
  combatGroupOptions,
  getCombatGroupColorClass,
} from "@/lib/encounter/colors";

type CombatGroupPickerProps = {
  combatant: EncounterCombatant;
  onUpdateGroup: (updates: {
    combatGroupLabel?: string;
    combatGroupColor?: string;
  }) => void;
};

export function CombatGroupPicker({
  combatant,
  onUpdateGroup,
}: CombatGroupPickerProps) {
  const [open, setOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState(
    combatant.combatGroupLabel ?? "",
  );
  const colorClass =
    getCombatGroupColorClass(combatant.combatGroupColor) ?? "bg-slate-600";
  const label =
    combatant.combatGroupColor && combatant.combatGroupColor !== "None"
      ? combatant.combatGroupLabel || combatant.combatGroupColor
      : "No Group";

  return (
    <div className="relative">
      <button
        className="inline-flex h-5 max-w-32 items-center gap-1 rounded-full border border-slate-700 bg-slate-950 px-1.5 text-[10px] font-bold text-slate-300"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${colorClass}`} />
        <span className="truncate">{label}</span>
      </button>

      {open ? (
        <div
          className="absolute left-0 top-6 z-30 w-52 rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="px-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
            Combat Group
          </p>
          <div className="mt-1 grid gap-1">
            {combatGroupOptions.map((option) => (
              <button
                className="flex h-8 items-center gap-2 rounded-lg px-2 text-left text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white"
                key={`${option.label}-${option.color}`}
                type="button"
                onClick={() => {
                  if (option.color === "None") {
                    onUpdateGroup({
                      combatGroupLabel: "",
                      combatGroupColor: "None",
                    });
                    setCustomLabel("");
                  } else {
                    onUpdateGroup({
                      combatGroupLabel: option.label,
                      combatGroupColor: option.color,
                    });
                    setCustomLabel(option.label);
                  }
                  setOpen(false);
                }}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${option.className}`} />
                {option.label}
              </button>
            ))}
          </div>
          <label className="mt-2 grid gap-1 px-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
            Custom Label
            <input
              className="h-8 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs font-semibold normal-case tracking-normal text-white outline-none focus:border-cyan-300"
              placeholder="e.g. Balcony Squad"
              value={customLabel}
              onChange={(event) => setCustomLabel(event.target.value)}
            />
          </label>
          <button
            className="mt-2 h-8 w-full rounded-lg bg-cyan-300 px-2 text-xs font-black text-slate-950"
            type="button"
            onClick={() => {
              onUpdateGroup({
                combatGroupLabel: customLabel,
                combatGroupColor:
                  combatant.combatGroupColor &&
                  combatant.combatGroupColor !== "None"
                    ? combatant.combatGroupColor
                    : "Gray",
              });
              setOpen(false);
            }}
          >
            Apply Label
          </button>
        </div>
      ) : null}
    </div>
  );
}
