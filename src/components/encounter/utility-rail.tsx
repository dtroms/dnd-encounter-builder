"use client";

import type { RunnerFilter } from "./initiative-list";

const filters: Array<{ key: RunnerFilter; label: string }> = [
  { key: "all", label: "Show all" },
  { key: "alive", label: "Alive only" },
  { key: "enemies", label: "Enemies only" },
  { key: "pcs", label: "PCs only" },
];

type UtilityRailProps = {
  filter: RunnerFilter;
  addPanelOpen: boolean;
  onFilterChange: (filter: RunnerFilter) => void;
  onToggleAddPanel: () => void;
  onRoll: () => void;
};

export function UtilityRail({
  filter,
  addPanelOpen,
  onFilterChange,
  onToggleAddPanel,
  onRoll,
}: UtilityRailProps) {
  return (
    <aside className="grid content-start gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-2 lg:sticky lg:top-3">
      <RailButton active={addPanelOpen} label="Add combatant" onClick={onToggleAddPanel} />
      <RailButton label="Add wave" muted onClick={() => undefined} />
      <RailButton label="Roll NPCs" onClick={onRoll} />

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
          Filter
        </p>
        <div className="mt-1.5 grid gap-1">
          {filters.map((item) => (
            <button
              className={`rounded-md px-2 py-1.5 text-left text-xs font-bold transition ${
                filter === item.key
                  ? "bg-cyan-300 text-slate-950"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
              key={item.key}
              type="button"
              onClick={() => onFilterChange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <Placeholder title="Condition tools" detail="Coming next" />
      <Placeholder title="Combat log" detail="Manual notes later" />
    </aside>
  );
}

function RailButton({
  label,
  active,
  muted,
  onClick,
}: {
  label: string;
  active?: boolean;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`min-h-9 rounded-lg border px-2 py-1.5 text-left text-xs font-black transition ${
        active
          ? "border-cyan-300 bg-cyan-300 text-slate-950"
          : muted
            ? "border-slate-800 bg-slate-900/40 text-slate-500"
            : "border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-300"
      }`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Placeholder({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-2">
      <p className="text-xs font-black text-slate-300">{title}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{detail}</p>
    </div>
  );
}
