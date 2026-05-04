"use client";

import { useEffect, useMemo, useState } from "react";
import type { EncounterStatus } from "@/lib/encounter/db-types";
import {
  savedEncounterSamples,
  type DashboardCombatantPreview,
  type SavedEncounterSummary,
} from "@/lib/encounter/dashboard-sample-data";
import {
  archiveEncounter as archiveSavedEncounter,
  createEncounterShell,
  duplicateEncounter as duplicateSavedEncounter,
  fetchSavedEncounters,
} from "@/lib/encounter/encounter-queries";
import { encounterRecordToSavedEncounterSummary } from "@/lib/encounter/mappers";
import type { CombatantType } from "@/lib/encounter/types";

type StatusFilter = EncounterStatus | "all";
type SortMode = "recent" | "name" | "status";
type DetailTab = "overview" | "roster" | "notes";
type CampaignFilter = "all" | string;

const detailTabs: Array<{ key: DetailTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "roster", label: "Roster" },
  { key: "notes", label: "Notes" },
];

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

const campaignTabs: Array<{ id: CampaignFilter; label: string }> = [
  { id: "all", label: "All Campaigns" },
  { id: "lantern-road", label: "The Lantern Road" },
  { id: "moonwell-vale", label: "Moonwell Vale" },
  { id: "ash-gate", label: "Ash Gate" },
  { id: "violet-keg-cellars", label: "Violet Keg Cellars" },
];

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
  minion: "Minion",
  neutral: "Neutral",
  pc: "PC",
  summon: "Summon",
};

export function SavedEncountersDashboard({
  onCreateNew,
  onOpenBuilder,
  onOpenRunner,
  useSupabaseData = false,
}: {
  onCreateNew: () => void;
  onOpenBuilder: () => void;
  onOpenRunner: () => void;
  useSupabaseData?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>("overview");
  const [encounters, setEncounters] = useState<SavedEncounterSummary[]>(
    savedEncounterSamples,
  );
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(useSupabaseData);
  const [isMutating, setIsMutating] = useState(false);
  const [selectedEncounterId, setSelectedEncounterId] = useState(
    savedEncounterSamples[0]?.id ?? "",
  );

  useEffect(() => {
    if (!useSupabaseData) {
      return;
    }

    let active = true;

    async function loadEncounters() {
      setIsLoading(true);
      setDashboardError(null);

      const result = await fetchSavedEncounters();

      if (!active) {
        return;
      }

      if (result.error || !result.data) {
        setDashboardError(result.error ?? "Could not load saved encounters.");
        setEncounters([]);
        setSelectedEncounterId("");
      } else {
        const summaries = result.data.map(encounterRecordToSavedEncounterSummary);
        setEncounters(summaries);
        setSelectedEncounterId((current) =>
          summaries.some((encounter) => encounter.id === current)
            ? current
            : summaries[0]?.id ?? "",
        );
      }

      setIsLoading(false);
    }

    void loadEncounters();

    return () => {
      active = false;
    };
  }, [useSupabaseData]);

  async function reloadSupabaseEncounters() {
    if (!useSupabaseData) {
      return;
    }

    setIsLoading(true);
    setDashboardError(null);

    const result = await fetchSavedEncounters();

    if (result.error || !result.data) {
      setDashboardError(result.error ?? "Could not load saved encounters.");
      setIsLoading(false);
      return;
    }

    const summaries = result.data.map(encounterRecordToSavedEncounterSummary);
    setEncounters(summaries);
    setSelectedEncounterId((current) =>
      summaries.some((encounter) => encounter.id === current)
        ? current
        : summaries[0]?.id ?? "",
    );
    setIsLoading(false);
  }

  const visibleEncounters = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return encounters
      .filter((encounter) => {
        const matchesCampaign =
          campaignFilter === "all" || encounter.campaign_id === campaignFilter;
        const matchesStatus =
          statusFilter === "all" || encounter.status === statusFilter;
        const searchable = [
          encounter.name,
          encounter.location,
          encounter.description,
          encounter.campaign_name,
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesCampaign &&
          matchesStatus &&
          searchable.includes(normalizedQuery)
        );
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
  }, [campaignFilter, encounters, query, sortMode, statusFilter]);

  const selectedEncounter =
    visibleEncounters.find((encounter) => encounter.id === selectedEncounterId) ??
    visibleEncounters[0] ??
    null;

  async function handleCreateNew() {
    if (!useSupabaseData) {
      onCreateNew();
      return;
    }

    setIsMutating(true);
    setDashboardError(null);

    const result = await createEncounterShell();

    if (result.error || !result.data) {
      setDashboardError(result.error ?? "Could not create encounter.");
    } else {
      const summary = encounterRecordToSavedEncounterSummary(result.data);
      setEncounters((current) => [summary, ...current]);
      setSelectedEncounterId(summary.id);
      setStatusFilter((current) => (current === "archived" ? "all" : current));
      setActiveDetailTab("overview");
    }

    setIsMutating(false);
  }

  async function duplicateEncounter(encounter: SavedEncounterSummary) {
    if (useSupabaseData) {
      setIsMutating(true);
      setDashboardError(null);

      const result = await duplicateSavedEncounter(encounter.id);

      if (result.error || !result.data) {
        setDashboardError(result.error ?? "Could not duplicate encounter.");
      } else {
        const copy = encounterRecordToSavedEncounterSummary(result.data);
        setEncounters((current) => [copy, ...current]);
        setSelectedEncounterId(copy.id);
        setStatusFilter((current) => (current === "archived" ? "all" : current));
        setActiveDetailTab("overview");
        setArchiveConfirmId(null);
      }

      setIsMutating(false);
      return;
    }

    const now = new Date().toISOString();
    const copy: SavedEncounterSummary = {
      ...encounter,
      combatants_preview: encounter.combatants_preview.map((combatant) => ({
        ...combatant,
        id: `${combatant.id}-copy-${Date.now()}`,
      })),
      current_round: 1,
      current_turn_index: 0,
      id: `local-copy-${Date.now()}`,
      last_played_at: null,
      name: `${encounter.name} Copy`,
      reminders: encounter.reminders ? [...encounter.reminders] : undefined,
      status: "draft",
      updated_at: now,
    };

    setEncounters((current) => [copy, ...current]);
    setSelectedEncounterId(copy.id);
    setStatusFilter((current) => (current === "archived" ? "all" : current));
    setActiveDetailTab("overview");
    setArchiveConfirmId(null);
  }

  async function archiveEncounter(encounter: SavedEncounterSummary) {
    if (useSupabaseData) {
      setIsMutating(true);
      setDashboardError(null);

      const result = await archiveSavedEncounter(encounter.id);

      if (result.error || !result.data) {
        setDashboardError(result.error ?? "Could not archive encounter.");
      } else {
        const archived = encounterRecordToSavedEncounterSummary(result.data);
        setEncounters((current) =>
          current.map((item) => (item.id === archived.id ? archived : item)),
        );
        setArchiveConfirmId(null);
      }

      setIsMutating(false);
      return;
    }

    const now = new Date().toISOString();

    setEncounters((current) =>
      current.map((item) =>
        item.id === encounter.id
          ? {
              ...item,
              status: "archived",
              updated_at: now,
            }
          : item,
      ),
    );
    setArchiveConfirmId(null);
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">Saved Encounters</h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-400">
              {useSupabaseData
                ? "Signed-in encounter metadata is saved to Supabase. Builder and Runner still use the local prototype state for now."
                : "Choose an encounter to run, edit, or review."}
            </p>
          </div>
          <button
            className="rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.18)] transition hover:bg-cyan-200 disabled:cursor-wait disabled:bg-slate-700 disabled:text-slate-300"
            disabled={isMutating}
            type="button"
            onClick={handleCreateNew}
          >
            {isMutating ? "Working..." : "Create New Encounter"}
          </button>
        </div>
      </div>

      <CampaignTabs
        activeCampaign={campaignFilter}
        onCampaignChange={(campaign) => {
          setCampaignFilter(campaign);
          setActiveDetailTab("overview");
        }}
      />

      <DashboardFilters
        query={query}
        sortMode={sortMode}
        statusFilter={statusFilter}
        onClearFilters={() => {
          setQuery("");
          setStatusFilter("all");
        }}
        onQueryChange={setQuery}
        onSortModeChange={setSortMode}
        onStatusFilterChange={setStatusFilter}
      />

      {dashboardError ? (
        <DashboardErrorState
          error={dashboardError}
          onRetry={useSupabaseData ? reloadSupabaseEncounters : undefined}
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.37fr)_minmax(0,0.63fr)]">
        <aside className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h3 className="text-base font-black text-white">Your Encounters</h3>
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-black text-slate-400">
              {visibleEncounters.length} shown
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 text-xs font-bold text-slate-500">
            <span className="truncate">{getCampaignLabel(campaignFilter)}</span>
            <span>
              {statusFilter === "all" ? "All statuses" : statusLabels[statusFilter]}
            </span>
          </div>

          {isLoading ? (
            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/55 p-6 text-center">
              <p className="text-sm font-black text-slate-200">
                Loading saved encounters...
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                Pulling your encounter metadata from Supabase.
              </p>
            </div>
          ) : null}

          <div className="mt-2 grid gap-2">
            {visibleEncounters.map((encounter) => (
              <EncounterListItem
                encounter={encounter}
                isSelected={encounter.id === selectedEncounter?.id}
                key={encounter.id}
                onSelect={() => {
                  setSelectedEncounterId(encounter.id);
                  setActiveDetailTab("overview");
                }}
              />
            ))}
          </div>

          {!isLoading && visibleEncounters.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center">
              <p className="text-sm font-black text-slate-200">
                {encounters.length === 0
                  ? "No saved encounters yet"
                  : "No encounters found"}
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                {encounters.length === 0
                  ? "Create your first encounter to get started."
                  : "Clear the search, switch back to All, or create a new encounter."}
              </p>
              <button
                className="mt-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-300/60 hover:text-white"
                type="button"
                onClick={
                  encounters.length === 0
                    ? handleCreateNew
                    : () => {
                        setQuery("");
                        setStatusFilter("all");
                      }
                }
              >
                {encounters.length === 0 ? "Create New Encounter" : "Clear Filters"}
              </button>
            </div>
          ) : null}
        </aside>

        {selectedEncounter ? (
          <EncounterDetailPanel
            encounter={selectedEncounter}
            activeTab={activeDetailTab}
            onActiveTabChange={setActiveDetailTab}
            archiveConfirmOpen={archiveConfirmId === selectedEncounter.id}
            onArchive={() => setArchiveConfirmId(selectedEncounter.id)}
            onArchiveCancel={() => setArchiveConfirmId(null)}
            onArchiveConfirm={() => archiveEncounter(selectedEncounter)}
            onDuplicate={() => duplicateEncounter(selectedEncounter)}
            isBusy={isMutating}
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
  onClearFilters,
  query,
  sortMode,
  statusFilter,
  onQueryChange,
  onSortModeChange,
  onStatusFilterChange,
}: {
  onClearFilters: () => void;
  query: string;
  sortMode: SortMode;
  statusFilter: StatusFilter;
  onQueryChange: (query: string) => void;
  onSortModeChange: (sortMode: SortMode) => void;
  onStatusFilterChange: (statusFilter: StatusFilter) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <input
        aria-label="Search saved encounters"
        className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70"
        placeholder="Search encounters"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
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

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
            Sort
            <select
              className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm font-bold normal-case tracking-normal text-white outline-none focus:border-cyan-300/70"
              value={sortMode}
              onChange={(event) =>
                onSortModeChange(event.target.value as SortMode)
              }
            >
              <option value="recent">Recent</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
            </select>
          </label>
          <button
            className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-black text-slate-400 transition hover:border-cyan-300/60 hover:text-white"
            type="button"
            onClick={onClearFilters}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

function CampaignTabs({
  activeCampaign,
  onCampaignChange,
}: {
  activeCampaign: CampaignFilter;
  onCampaignChange: (campaign: CampaignFilter) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2">
      <div className="flex gap-1 overflow-x-auto">
        {campaignTabs.map((campaign) => (
          <button
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-black transition ${
              activeCampaign === campaign.id
                ? "bg-cyan-300 text-slate-950"
                : "border border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-600 hover:text-white"
            }`}
            key={campaign.id}
            type="button"
            onClick={() => onCampaignChange(campaign.id)}
          >
            {campaign.label}
          </button>
        ))}
      </div>
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
  activeTab,
  archiveConfirmOpen,
  encounter,
  isBusy,
  onActiveTabChange,
  onArchive,
  onArchiveCancel,
  onArchiveConfirm,
  onDuplicate,
  onOpenBuilder,
  onOpenRunner,
}: {
  activeTab: DetailTab;
  archiveConfirmOpen: boolean;
  encounter: SavedEncounterSummary;
  isBusy: boolean;
  onActiveTabChange: (tab: DetailTab) => void;
  onArchive: () => void;
  onArchiveCancel: () => void;
  onArchiveConfirm: () => void;
  onDuplicate: () => void;
  onOpenBuilder: () => void;
  onOpenRunner: () => void;
}) {
  const accent = accentStyles[encounter.accent_color];
  const isRunning = encounter.status === "running";

  return (
    <section
      className={`overflow-hidden rounded-xl border bg-slate-900/65 shadow-2xl shadow-black/20 ${
        isRunning ? accent.border : "border-slate-800"
      }`}
    >
      <div className={`h-2 ${accent.dot}`} />
      <div className="p-4 sm:p-5">
        <div className="rounded-xl bg-slate-950/80 p-4 shadow-inner shadow-black/15">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip encounter={encounter} />
                {encounter.boss_count_snapshot > 0 ? (
                  <span className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-amber-100">
                    Boss
                  </span>
                ) : null}
                {encounter.has_lair_actions_snapshot ? (
                  <span className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-amber-100">
                    Lair actions
                  </span>
                ) : null}
              </div>

              <h3 className="mt-3 text-3xl font-black leading-tight text-white">
                {encounter.name}
              </h3>
              <p className="mt-2 text-sm font-bold text-slate-400">
                {encounter.location}
              </p>
              <p className="mt-4 max-w-4xl text-[15px] font-semibold leading-7 text-slate-200">
                {encounter.description}
              </p>
            </div>

            <ActionButtons
              encounter={encounter}
              isBusy={isBusy}
              isRunning={isRunning}
              onArchive={onArchive}
              onDuplicate={onDuplicate}
              onOpenBuilder={onOpenBuilder}
              onOpenRunner={onOpenRunner}
            />
          </div>
        </div>

        {archiveConfirmOpen ? (
          <div className="mt-4 rounded-xl border border-rose-400/35 bg-rose-500/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-rose-100">
                  Archive this encounter?
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-rose-100/70">
                  This changes the status to Archived but keeps the encounter in
                  the local list.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-200 transition hover:border-slate-500 hover:text-white"
                  type="button"
                  onClick={onArchiveCancel}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-rose-400 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-rose-300"
                  disabled={isBusy}
                  type="button"
                  onClick={onArchiveConfirm}
                >
                  {isBusy ? "Archiving..." : "Confirm Archive"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <DetailTabs activeTab={activeTab} onActiveTabChange={onActiveTabChange} />

        <div className="mt-4">
          {activeTab === "overview" ? (
            <OverviewTab encounter={encounter} isRunning={isRunning} />
          ) : null}
          {activeTab === "roster" ? <RosterTab encounter={encounter} /> : null}
          {activeTab === "notes" ? <NotesTab encounter={encounter} /> : null}
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
        Choose an encounter on the left to view details, open the Builder, or
        start the Runner.
      </p>
    </section>
  );
}

function DashboardErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-rose-100">
            Could not load saved encounters.
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-rose-100/75">
            {error}
          </p>
        </div>
        {onRetry ? (
          <button
            className="rounded-lg border border-rose-200/45 bg-slate-950 px-3 py-2 text-xs font-black text-rose-100 transition hover:border-rose-100 hover:text-white"
            type="button"
            onClick={onRetry}
          >
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ActionButtons({
  encounter,
  isBusy,
  isRunning,
  onArchive,
  onDuplicate,
  onOpenBuilder,
  onOpenRunner,
}: {
  encounter: SavedEncounterSummary;
  isBusy: boolean;
  isRunning: boolean;
  onArchive: () => void;
  onDuplicate: () => void;
  onOpenBuilder: () => void;
  onOpenRunner: () => void;
}) {
  const primaryAction =
    encounter.status === "draft" ? "Open Builder" : "Open Runner";
  const secondaryAction =
    encounter.status === "draft" ? "Open Runner" : "Open Builder";
  const primaryHandler =
    encounter.status === "draft" ? onOpenBuilder : onOpenRunner;
  const secondaryHandler =
    encounter.status === "draft" ? onOpenRunner : onOpenBuilder;

  return (
    <div className="flex max-w-full flex-wrap justify-end gap-2">
      <button
        className={`rounded-lg px-3 py-2 text-xs font-black transition ${
          isRunning || encounter.status === "draft"
            ? "bg-cyan-300 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.16)] hover:bg-cyan-200"
            : "border border-cyan-300/45 bg-cyan-300/10 text-cyan-100 hover:border-cyan-200 hover:text-white"
        }`}
        disabled={isBusy}
        type="button"
        onClick={primaryHandler}
      >
        {primaryAction}
      </button>
      <button
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 transition hover:border-cyan-300/60 hover:text-white"
        disabled={isBusy}
        type="button"
        onClick={secondaryHandler}
      >
        {secondaryAction}
      </button>
      <button
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 transition hover:border-cyan-300/60 hover:text-white"
        disabled={isBusy}
        type="button"
        onClick={onDuplicate}
      >
        {isBusy ? "Working..." : "Duplicate"}
      </button>
      <button
        className="rounded-lg border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-xs font-black text-rose-100 transition hover:border-rose-300 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-950/60 disabled:text-slate-500"
        disabled={isBusy || encounter.status === "archived"}
        type="button"
        onClick={onArchive}
      >
        {encounter.status === "archived" ? "Archived" : "Archive"}
      </button>
    </div>
  );
}

function DetailTabs({
  activeTab,
  onActiveTabChange,
}: {
  activeTab: DetailTab;
  onActiveTabChange: (tab: DetailTab) => void;
}) {
  return (
    <div className="mt-4 flex gap-1 rounded-lg border border-slate-800 bg-slate-950/55 p-1">
      {detailTabs.map((tab) => (
        <button
          className={`flex-1 rounded-md px-3 py-2 text-xs font-black transition ${
            activeTab === tab.key
              ? "bg-cyan-300 text-slate-950"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
          key={tab.key}
          type="button"
          onClick={() => onActiveTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function OverviewTab({
  encounter,
  isRunning,
}: {
  encounter: SavedEncounterSummary;
  isRunning: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-950/45 p-4">
      <SectionHeader eyebrow="Overview" title="What kind of encounter is this?" />
      <div className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
        <OverviewFact label="Difficulty" value={encounter.difficulty_label} />
        <OverviewFact
          label="Party"
          value={`Level ${encounter.party_level}, ${encounter.party_size} PCs`}
        />
        <OverviewFact
          label={isRunning ? "Current Round" : "Updated"}
          value={
            isRunning
              ? String(encounter.current_round)
              : formatLongDate(encounter.updated_at)
          }
        />
        <OverviewFact
          label="Last Played"
          value={
            encounter.last_played_at
              ? formatLongDate(encounter.last_played_at)
              : "Not played yet"
          }
        />
        <OverviewFact label="Special" value={getSpecialSummary(encounter)} />
        <OverviewFact label="Location" value={encounter.location} />
        <OverviewFact label="Campaign" value={encounter.campaign_name} />
      </div>
    </div>
  );
}

function RosterTab({ encounter }: { encounter: SavedEncounterSummary }) {
  return (
    <div className="rounded-xl bg-slate-950/45 p-4">
      <SectionHeader
        detail={`${encounter.combatant_count_snapshot} total`}
        eyebrow="Roster"
        title="Who is in this encounter?"
      />
      <p className="mt-1 text-xs font-semibold text-slate-500">
        Names only. Open Runner for full HP, initiative, and conditions.
      </p>
      <CombatantPreviewList combatants={encounter.combatants_preview} />
    </div>
  );
}

function NotesTab({ encounter }: { encounter: SavedEncounterSummary }) {
  return (
    <div className="rounded-xl bg-slate-950/45 p-4">
      <SectionHeader eyebrow="Notes" title="What should I remember?" />
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
        {encounter.notes ??
          encounter.description ??
          "No notes saved for this encounter yet."}
      </p>
      {encounter.reminders && encounter.reminders.length > 0 ? (
        <div className="mt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Reminders
          </p>
          <ul className="mt-2 space-y-2">
            {encounter.reminders.map((reminder) => (
              <li
                className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm font-semibold leading-6 text-slate-300"
                key={reminder}
              >
                {reminder}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
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

function OverviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
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

function getCampaignLabel(campaignId: CampaignFilter) {
  return (
    campaignTabs.find((campaign) => campaign.id === campaignId)?.label ??
    "All Campaigns"
  );
}

function CombatantPreviewList({
  combatants,
}: {
  combatants: DashboardCombatantPreview[];
}) {
  const visibleCombatants = combatants.slice(0, 12);
  const remainingCount = Math.max(0, combatants.length - visibleCombatants.length);
  const groupedCombatants = groupCombatantsByGroup(visibleCombatants);

  return (
    <div className="mt-3 space-y-3">
      {groupedCombatants.map((group) => (
        <div key={group.name}>
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${groupColorStyles[group.colorKey].dot}`}
            />
            <p className="text-xs font-black text-slate-300">{group.name}</p>
            <span className="text-[11px] font-bold text-slate-600">
              {group.combatants.length}
            </span>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {group.combatants.map((combatant) => (
              <CombatantPreviewItem combatant={combatant} key={combatant.id} />
            ))}
          </div>
        </div>
      ))}
      {remainingCount > 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-black text-slate-400">
          + {remainingCount} more in encounter
        </div>
      ) : null}
    </div>
  );
}

function groupCombatantsByGroup(combatants: DashboardCombatantPreview[]) {
  const groups = new Map<
    string,
    {
      colorKey: DashboardCombatantPreview["group_color_key"];
      combatants: DashboardCombatantPreview[];
      name: string;
    }
  >();

  combatants.forEach((combatant) => {
    const groupName = combatant.group_name || "Ungrouped";
    const existing = groups.get(groupName);

    if (existing) {
      existing.combatants.push(combatant);
      return;
    }

    groups.set(groupName, {
      colorKey: combatant.group_color_key,
      combatants: [combatant],
      name: groupName,
    });
  });

  return [...groups.values()];
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
