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
    dot: "bg-emerald-400",
    border: "border-emerald-400/25",
    text: "text-emerald-100",
    bg: "bg-emerald-500/10",
  },
  Red: {
    dot: "bg-rose-400",
    border: "border-rose-400/25",
    text: "text-rose-100",
    bg: "bg-rose-500/10",
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
    savedEncounterSamples[0];

  return (
    <section className="space-y-3">
      <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-4 shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">
              Encounter archive
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">
              Saved Encounters
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Local master-detail shell for saved encounters. Pick an encounter
              on the left to inspect its table-ready dossier.
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

      <div className="grid gap-3 xl:grid-cols-[minmax(320px,0.38fr)_minmax(0,0.62fr)]">
        <aside className="rounded-xl border border-slate-800 bg-slate-950/75 p-3">
          <DashboardFilters
            query={query}
            sortMode={sortMode}
            statusFilter={statusFilter}
            onQueryChange={setQuery}
            onSortModeChange={setSortMode}
            onStatusFilterChange={setStatusFilter}
          />

          <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>{visibleEncounters.length} shown</span>
            <span>{savedEncounterSamples.length} saved</span>
          </div>

          <div className="mt-3 grid gap-2">
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
            <div className="mt-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center">
              <p className="text-sm font-bold text-slate-300">
                No saved encounters match this view.
              </p>
            </div>
          ) : null}
        </aside>

        <EncounterDetailPanel
          encounter={selectedEncounter}
          onOpenBuilder={onOpenBuilder}
          onOpenRunner={onOpenRunner}
        />
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
      className={`relative overflow-hidden rounded-xl border p-3 text-left transition ${
        isSelected
          ? `${accent.border} ${accent.bg} ring-2 ${accent.ring}`
          : "border-slate-800 bg-slate-900/70 hover:border-slate-600"
      }`}
      type="button"
      onClick={onSelect}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${accent.dot}`} />
      <div className="pl-2">
        <div className="flex flex-wrap items-center gap-2">
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
        <h3 className="mt-2 line-clamp-1 text-base font-black text-white">
          {encounter.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-400">
          {encounter.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold text-slate-500">
          <span className="line-clamp-1">{encounter.location}</span>
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
      className={`rounded-xl border bg-slate-950/80 p-4 shadow-2xl shadow-black/20 ${
        isRunning ? accent.border : "border-slate-800"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip encounter={encounter} />
            {encounter.has_lair_actions_snapshot ? (
              <span className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-amber-100">
                Lair actions
              </span>
            ) : null}
            {encounter.boss_count_snapshot > 0 ? (
              <span className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-amber-100">
                Boss present
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-xs font-bold text-slate-500">
            {encounter.location}
          </p>
          <h3 className="mt-2 text-3xl font-black leading-tight text-white">
            {encounter.name}
          </h3>
          <p className="mt-3 max-w-4xl text-[15px] font-semibold leading-7 text-slate-300">
            {encounter.description}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <DetailStat
          label={isRunning ? "Current Round" : "Status Date"}
          value={
            isRunning
              ? String(encounter.current_round)
              : formatCompactDate(encounter.updated_at)
          }
        />
        <DetailStat label="Party Level" value={String(encounter.party_level)} />
        <DetailStat label="Party Size" value={String(encounter.party_size)} />
        <DetailStat label="Difficulty" value={encounter.difficulty_label} />
        <DetailStat
          label="Last Played"
          value={
            encounter.last_played_at
              ? formatLongDate(encounter.last_played_at)
              : "Not played yet"
          }
        />
        <DetailStat label="Updated" value={formatLongDate(encounter.updated_at)} />
        <DetailStat
          label="Bosses"
          value={
            encounter.boss_count_snapshot > 0
              ? String(encounter.boss_count_snapshot)
              : "None"
          }
        />
        <DetailStat
          label="Lair Actions"
          value={encounter.has_lair_actions_snapshot ? "Ready" : "None"}
        />
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/55 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-black text-white">Combatants</h4>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Names-only preview from local mock data
            </p>
          </div>
          <span className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-black text-slate-300">
            {encounter.combatant_count_snapshot} total
          </span>
        </div>
        <CombatantPreviewList combatants={encounter.combatants_preview} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 transition hover:border-cyan-300/60 hover:text-white"
          type="button"
          onClick={onOpenBuilder}
        >
          Open Builder
        </button>
        <button
          className={`rounded-lg px-3 py-2 text-xs font-black transition ${
            isRunning
              ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              : "border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-300/60 hover:text-white"
          }`}
          type="button"
          onClick={onOpenRunner}
        >
          Open Runner
        </button>
        <button
          className="cursor-not-allowed rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-black text-slate-500"
          disabled
          type="button"
        >
          Duplicate later
        </button>
        <button
          className="cursor-not-allowed rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-black text-slate-500"
          disabled
          type="button"
        >
          Archive later
        </button>
      </div>
    </section>
  );
}

function CombatantPreviewList({
  combatants,
}: {
  combatants: DashboardCombatantPreview[];
}) {
  const visibleCombatants = combatants.slice(0, 10);
  const remainingCount = Math.max(0, combatants.length - visibleCombatants.length);

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {visibleCombatants.map((combatant) => (
        <CombatantPreviewItem combatant={combatant} key={combatant.id} />
      ))}
      {remainingCount > 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-bold text-slate-400">
          + {remainingCount} more
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
      className={`flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 ${groupStyle.border} ${groupStyle.bg}`}
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${groupStyle.dot}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-white">{combatant.name}</p>
        <p className={`truncate text-[11px] font-bold ${groupStyle.text}`}>
          {combatant.group_name}
        </p>
      </div>
      <span className="rounded-md border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-400">
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
      {encounter.status}
    </span>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
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
