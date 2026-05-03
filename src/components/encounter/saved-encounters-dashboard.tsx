"use client";

import { useMemo, useState } from "react";
import type { EncounterStatus } from "@/lib/encounter/db-types";
import {
  savedEncounterSamples,
  type DashboardCombatantPreview,
  type SavedEncounterSummary,
} from "@/lib/encounter/dashboard-sample-data";
import type { CombatantType } from "@/lib/encounter/types";

type StatusFilter = EncounterStatus | "all";
type SortMode = "recent" | "name" | "status";

const statusFilters: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "running", label: "Running" },
  { key: "completed", label: "Completed" },
  { key: "archived", label: "Archived" },
];

const statusRank: Record<EncounterStatus, number> = {
  running: 0,
  draft: 1,
  completed: 2,
  archived: 3,
};

const statusLabels: Record<EncounterStatus, string> = {
  archived: "Archived",
  completed: "Completed",
  draft: "Draft",
  running: "Running",
};

const accentStyles: Record<
  SavedEncounterSummary["accent_color"],
  { border: string; bg: string; text: string; dot: string; ring: string }
> = {
  Blue: {
    border: "border-blue-400/35",
    bg: "bg-blue-500/10",
    text: "text-blue-100",
    dot: "bg-blue-400",
    ring: "ring-blue-400/20",
  },
  Green: {
    border: "border-emerald-400/35",
    bg: "bg-emerald-500/10",
    text: "text-emerald-100",
    dot: "bg-emerald-400",
    ring: "ring-emerald-400/20",
  },
  Red: {
    border: "border-rose-400/35",
    bg: "bg-rose-500/10",
    text: "text-rose-100",
    dot: "bg-rose-400",
    ring: "ring-rose-400/20",
  },
  Gold: {
    border: "border-amber-300/45",
    bg: "bg-amber-300/10",
    text: "text-amber-100",
    dot: "bg-amber-300",
    ring: "ring-amber-300/20",
  },
  Purple: {
    border: "border-purple-400/40",
    bg: "bg-purple-500/10",
    text: "text-purple-100",
    dot: "bg-purple-400",
    ring: "ring-purple-400/20",
  },
  Gray: {
    border: "border-zinc-500/40",
    bg: "bg-zinc-500/10",
    text: "text-zinc-100",
    dot: "bg-zinc-400",
    ring: "ring-zinc-400/20",
  },
  Cyan: {
    border: "border-cyan-300/40",
    bg: "bg-cyan-300/10",
    text: "text-cyan-100",
    dot: "bg-cyan-300",
    ring: "ring-cyan-300/20",
  },
  Magenta: {
    border: "border-fuchsia-400/40",
    bg: "bg-fuchsia-500/10",
    text: "text-fuchsia-100",
    dot: "bg-fuchsia-400",
    ring: "ring-fuchsia-400/20",
  },
};

const groupColorStyles: Record<
  DashboardCombatantPreview["group_color_key"],
  { dot: string; border: string; text: string; bg: string }
> = {
  Blue: {
    dot: "bg-blue-400",
    border: "border-blue-400/25",
    text: "text-blue-100",
    bg: "bg-blue-500/10",
  },
  Green: {
    dot: "bg-green-500",
    border: "border-green-400/20",
    text: "text-green-100",
    bg: "bg-green-500/8",
  },
  Red: {
    dot: "bg-red-500",
    border: "border-red-400/20",
    text: "text-red-100",
    bg: "bg-red-500/8",
  },
  Gold: {
    dot: "bg-amber-300",
    border: "border-amber-300/30",
    text: "text-amber-100",
    bg: "bg-amber-300/10",
  },
  Purple: {
    dot: "bg-purple-400",
    border: "border-purple-400/25",
    text: "text-purple-100",
    bg: "bg-purple-500/10",
  },
  Gray: {
    dot: "bg-zinc-400",
    border: "border-zinc-500/30",
    text: "text-zinc-100",
    bg: "bg-zinc-500/10",
  },
  Cyan: {
    dot: "bg-cyan-300",
    border: "border-cyan-300/25",
    text: "text-cyan-100",
    bg: "bg-cyan-300/10",
  },
  Magenta: {
    dot: "bg-fuchsia-400",
    border: "border-fuchsia-400/25",
    text: "text-fuchsia-100",
    bg: "bg-fuchsia-500/10",
  },
  None: {
    dot: "bg-slate-500",
    border: "border-slate-700",
    text: "text-slate-300",
    bg: "bg-slate-900",
  },
};

const typeLabels: Record<CombatantType, string> = {
  ally: "Ally",
  boss: "Boss",
  enemy: "Enemy",
  neutral: "Neutral",
  pc: "PC",
  summon: "Summon",
};

export function SavedEncountersDashboard({
  onCreateNew,
  onOpenBuilder,
  onOpenRunner,
}: {
  onCreateNew: () => void;
  onOpenBuilder: () => void;
  onOpenRunner: () => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [selectedEncounterId, setSelectedEncounterId] = useState(
    savedEncounterSamples[0]?.id ?? "",
  );

  const visibleEncounters = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return savedEncounterSamples
      .filter((encounter) => {
        const matchesStatus =
          statusFilter === "all" || encounter.status === statusFilter;
        const searchable = [
          encounter.name,
          encounter.location,
          encounter.description,
        ]
          .join(" ")
          .toLowerCase();

        return matchesStatus && searchable.includes(normalizedQuery);
      })
      .sort((left, right) => {
        if (sortMode === "name") {
          return left.name.localeCompare(right.name);
        }

        if (sortMode === "status") {
          return (
            statusRank[left.status] - statusRank[right.status] ||
            left.name.localeCompare(right.name)
          );
        }

        return getSortTime(right) - getSortTime(left);
      });
  }, [query, sortMode, statusFilter]);

  const selectedEncounter =
    visibleEncounters.find((encounter) => encounter.id === selectedEncounterId) ??
    visibleEncounters[0] ??
    null;

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">Saved Encounters</h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-400">
              Choose an encounter to edit, run, or review.
            </p>
          </div>
          <button
            className="rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.18)] transition hover:bg-cyan-200"
            type="button"
            onClick={onCreateNew}
          >
            Create New Encounter
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.37fr)_minmax(0,0.63fr)]">
        <aside className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-end justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-white">Your Encounters</h3>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                Pick one to inspect on the right.
              </p>
            </div>
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-black text-slate-400">
              {savedEncounterSamples.length} saved
            </span>
          </div>

          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/55 p-2.5">
            <DashboardFilters
              query={query}
              sortMode={sortMode}
              statusFilter={statusFilter}
              onQueryChange={setQuery}
              onSortModeChange={setSortMode}
              onStatusFilterChange={setStatusFilter}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>{visibleEncounters.length} shown</span>
            <span>
              {statusFilter === "all" ? "All statuses" : statusLabels[statusFilter]}
            </span>
          </div>

          <div className="mt-2 grid gap-2">
            {visibleEncounters.map((encounter) => (
              <EncounterListItem
                encounter={encounter}
                isSelected={encounter.id === selectedEncounter?.id}
                key={encounter.id}
                onSelect={() => setSelectedEncounterId(encounter.id)}
              />
            ))}
          </div>

          {visibleEncounters.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center">
              <p className="text-sm font-black text-slate-200">
                No encounters found
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                Clear the search, switch back to All, or create a new encounter.
              </p>
            </div>
          ) : null}
        </aside>

        {selectedEncounter ? (
          <EncounterDetailPanel
            encounter={selectedEncounter}
            onOpenBuilder={onOpenBuilder}
            onOpenRunner={onOpenRunner}
          />
        ) : (
          <EmptyDetailPanel />
        )}
      </div>
    </section>
  );
}

function DashboardFilters({
  query,
  sortMode,
  statusFilter,
  onQueryChange,
  onSortModeChange,
  onStatusFilterChange,
}: {
  query: string;
  sortMode: SortMode;
  statusFilter: StatusFilter;
  onQueryChange: (query: string) => void;
  onSortModeChange: (sortMode: SortMode) => void;
  onStatusFilterChange: (statusFilter: StatusFilter) => void;
}) {
  return (
    <div className="space-y-3">
      <input
        aria-label="Search saved encounters"
        className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70"
        placeholder="Search encounters"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />

      <div className="flex flex-wrap gap-1.5">
        {statusFilters.map((filter) => (
          <button
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-black transition ${
              statusFilter === filter.key
                ? "border-cyan-300 bg-cyan-300 text-slate-950"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white"
            }`}
            key={filter.key}
            type="button"
            onClick={() => onStatusFilterChange(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <label className="flex items-center justify-between gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
        Sort
        <select
          className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm font-bold normal-case tracking-normal text-white outline-none focus:border-cyan-300/70"
          value={sortMode}
          onChange={(event) => onSortModeChange(event.target.value as SortMode)}
        >
          <option value="recent">Recent</option>
          <option value="name">Name</option>
          <option value="status">Status</option>
        </select>
      </label>
    </div>
  );
}

function EncounterListItem({
  encounter,
  isSelected,
  onSelect,
}: {
  encounter: SavedEncounterSummary;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const accent = accentStyles[encounter.accent_color];
  const isRunning = encounter.status === "running";

  return (
    <button
      className={`group relative overflow-hidden rounded-lg border p-3 text-left transition ${
        isSelected
          ? `${accent.border} ${accent.bg} shadow-[0_0_0_1px_rgba(255,255,255,0.05)] ring-2 ${accent.ring}`
          : "border-slate-800 bg-slate-900/55 hover:border-slate-600 hover:bg-slate-900/80"
      }`}
      aria-pressed={isSelected}
      type="button"
      onClick={onSelect}
    >
      <span
        className={`absolute inset-y-0 left-0 ${isSelected ? "w-1.5" : "w-1"} ${accent.dot}`}
      />
      <div className="pl-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <StatusChip encounter={encounter} compact />
            {encounter.has_lair_actions_snapshot ? (
              <span className="rounded-md border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-100">
                Lair
              </span>
            ) : null}
            {isRunning ? (
              <span className="text-[11px] font-black text-cyan-200">
                Round {encounter.current_round}
              </span>
            ) : null}
          </div>
          {isSelected ? (
            <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-950">
              Selected
            </span>
          ) : (
            <span className="shrink-0 text-sm font-black text-slate-600 transition group-hover:text-slate-300">
              &gt;
            </span>
          )}
        </div>
        <h3 className="mt-2 line-clamp-1 text-base font-black text-white">
          {encounter.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-400">
          {encounter.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold text-slate-500">
          <span className="truncate">{encounter.location}</span>
          <span>
            {encounter.last_played_at
              ? `Last ${formatCompactDate(encounter.last_played_at)}`
              : `Updated ${formatCompactDate(encounter.updated_at)}`}
          </span>
        </div>
      </div>
    </button>
  );
}

function EncounterDetailPanel({
  encounter,
  onOpenBuilder,
  onOpenRunner,
}: {
  encounter: SavedEncounterSummary;
  onOpenBuilder: () => void;
  onOpenRunner: () => void;
}) {
  const accent = accentStyles[encounter.accent_color];
  const isRunning = encounter.status === "running";

  return (
    <section
      className={`overflow-hidden rounded-xl border bg-slate-900/70 shadow-2xl shadow-black/20 ${
        isRunning ? accent.border : "border-slate-800"
      }`}
    >
      <div className={`h-2 ${accent.dot}`} />
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
              Selected Encounter
            </p>
            <h3 className="mt-1 text-lg font-black text-white">
              Encounter Details
            </h3>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip encounter={encounter} />
                <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-300">
                  {encounter.combatant_count_snapshot} combatants
                </span>
                {encounter.has_lair_actions_snapshot ? (
                  <span className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-amber-100">
                    Lair actions
                  </span>
                ) : null}
                {encounter.boss_count_snapshot > 0 ? (
                  <span className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-amber-100">
                    Boss
                  </span>
                ) : null}
              </div>
              <h4 className="mt-3 text-3xl font-black leading-tight text-white">
                {encounter.name}
              </h4>
              <p className="mt-2 text-sm font-bold text-slate-400">
                {encounter.location}
              </p>
            </div>

            <ActionButtons
              isRunning={isRunning}
              onOpenBuilder={onOpenBuilder}
              onOpenRunner={onOpenRunner}
            />
          </div>

          <div
            className={`mt-4 rounded-lg border ${accent.border} ${accent.bg} p-3`}
          >
            <p className="text-sm font-semibold leading-6 text-slate-100">
              {encounter.description}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <SectionHeader eyebrow="Overview" title="At a glance" />
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <OverviewStat label="Status" value={statusLabels[encounter.status]} />
            <OverviewStat label="Difficulty" value={encounter.difficulty_label} />
            <OverviewStat
              label="Party"
              value={`Level ${encounter.party_level}, ${encounter.party_size} PCs`}
            />
            <OverviewStat
              label={isRunning ? "Current Round" : "Updated"}
              value={
                isRunning
                  ? String(encounter.current_round)
                  : formatLongDate(encounter.updated_at)
              }
            />
            <OverviewStat
              label="Last Played"
              value={
                encounter.last_played_at
                  ? formatLongDate(encounter.last_played_at)
                  : "Not played yet"
              }
            />
            <OverviewStat label="Special" value={getSpecialSummary(encounter)} />
          </div>
        </div>

        <div className="mt-5 border-t border-slate-800 pt-5">
          <SectionHeader
            eyebrow="Combatants"
            title="Encounter Roster Preview"
            detail={`${encounter.combatant_count_snapshot} total`}
          />
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Names only. Open Runner for full HP, initiative, and conditions.
          </p>
          <CombatantPreviewList combatants={encounter.combatants_preview} />
        </div>

        <div className="mt-5 border-t border-slate-800 pt-5">
          <SectionHeader eyebrow="Actions" title="Open or manage" />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="cursor-not-allowed rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs font-black text-slate-500"
              disabled
              type="button"
            >
              Duplicate later
            </button>
            <button
              className="cursor-not-allowed rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs font-black text-slate-500"
              disabled
              type="button"
            >
              Archive later
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyDetailPanel() {
  return (
    <section className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center">
      <p className="text-lg font-black text-white">Select an encounter</p>
      <p className="mt-2 text-sm font-semibold text-slate-500">
        Select an encounter to view details.
      </p>
    </section>
  );
}

function ActionButtons({
  isRunning,
  onOpenBuilder,
  onOpenRunner,
}: {
  isRunning: boolean;
  onOpenBuilder: () => void;
  onOpenRunner: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button
        className={`rounded-lg px-3 py-2 text-xs font-black transition ${
          isRunning
            ? "bg-cyan-300 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.16)] hover:bg-cyan-200"
            : "border border-cyan-300/45 bg-cyan-300/10 text-cyan-100 hover:border-cyan-200 hover:text-white"
        }`}
        type="button"
        onClick={isRunning ? onOpenRunner : onOpenBuilder}
      >
        {isRunning ? "Open Runner" : "Open Builder"}
      </button>
      <button
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 transition hover:border-cyan-300/60 hover:text-white"
        type="button"
        onClick={isRunning ? onOpenBuilder : onOpenRunner}
      >
        {isRunning ? "Open Builder" : "Open Runner"}
      </button>
    </div>
  );
}

function SectionHeader({
  detail,
  eyebrow,
  title,
}: {
  detail?: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          {eyebrow}
        </p>
        <h4 className="mt-1 text-base font-black text-white">{title}</h4>
      </div>
      {detail ? (
        <span className="rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1 text-xs font-black text-slate-300">
          {detail}
        </span>
      ) : null}
    </div>
  );
}

function OverviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/55 px-3 py-2.5">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-slate-100">{value}</p>
    </div>
  );
}

function getSpecialSummary(encounter: SavedEncounterSummary) {
  const notes: string[] = [];

  if (encounter.boss_count_snapshot > 0) {
    notes.push(`${encounter.boss_count_snapshot} boss`);
  }

  if (encounter.has_lair_actions_snapshot) {
    notes.push("Lair actions");
  }

  return notes.length > 0 ? notes.join(", ") : "None";
}

function CombatantPreviewList({
  combatants,
}: {
  combatants: DashboardCombatantPreview[];
}) {
  const visibleCombatants = combatants.slice(0, 8);
  const remainingCount = Math.max(0, combatants.length - visibleCombatants.length);

  return (
    <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
      {visibleCombatants.map((combatant) => (
        <CombatantPreviewItem combatant={combatant} key={combatant.id} />
      ))}
      {remainingCount > 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-black text-slate-400">
          + {remainingCount} more in encounter
        </div>
      ) : null}
    </div>
  );
}

function CombatantPreviewItem({
  combatant,
}: {
  combatant: DashboardCombatantPreview;
}) {
  const groupStyle = groupColorStyles[combatant.group_color_key];

  return (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 ${groupStyle.border} ${groupStyle.bg}`}
    >
      <span className={`h-7 w-1 shrink-0 rounded-full ${groupStyle.dot}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-white">{combatant.name}</p>
        {combatant.group_name !== "Ungrouped" ? (
          <p className={`truncate text-[11px] font-bold ${groupStyle.text}`}>
            {combatant.group_name}
          </p>
        ) : null}
      </div>
      <span className="shrink-0 rounded-md border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-400">
        {typeLabels[combatant.combatant_type]}
      </span>
    </div>
  );
}

function StatusChip({
  compact = false,
  encounter,
}: {
  compact?: boolean;
  encounter: SavedEncounterSummary;
}) {
  const accent = accentStyles[encounter.accent_color];
  const isRunning = encounter.status === "running";

  return (
    <span
      className={`rounded-lg border font-black uppercase tracking-wide ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      } ${
        isRunning
          ? `${accent.border} ${accent.bg} ${accent.text}`
          : "border-slate-700 bg-slate-900 text-slate-300"
      }`}
    >
      {statusLabels[encounter.status]}
    </span>
  );
}

function getSortTime(encounter: SavedEncounterSummary) {
  return new Date(encounter.last_played_at ?? encounter.updated_at).getTime();
}

function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
