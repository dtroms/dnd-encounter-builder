import type { EncounterView } from "./app-shell";

type TopBarProps = {
  encounterName: string;
  combatantCount: number;
  round: number;
  activeName: string;
  activeView: EncounterView;
  authModeLabel?: string;
  userEmail?: string;
  onSignOut?: () => void;
};

export function TopBar({
  encounterName,
  combatantCount,
  round,
  activeName,
  activeView,
  authModeLabel,
  userEmail,
  onSignOut,
}: TopBarProps) {
  const title =
    activeView === "encounters"
      ? "Saved Encounters"
      : activeView === "importer"
        ? "Stat Block Importer"
        : encounterName;
  const badges = getTopBarBadges({
    activeName,
    activeView,
    combatantCount,
    round,
  });

  return (
    <header className="border-b border-slate-800/90 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4 lg:px-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">
            D&D Encounter Builder
          </p>
          <h1 className="mt-0.5 text-xl font-black tracking-normal text-white md:text-2xl">
            {title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-300">
          {authModeLabel ? (
            <span className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1.5 text-cyan-100">
              {authModeLabel}
            </span>
          ) : null}
          {userEmail ? (
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5">
              {userEmail}
            </span>
          ) : null}
          {badges.map((badge) => (
            <span
              className={`rounded-lg border px-2.5 py-1.5 ${badge.className}`}
              key={badge.label}
            >
              {badge.label}
            </span>
          ))}
          {onSignOut ? (
            <button
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-black text-slate-200 transition hover:border-red-300/40 hover:bg-red-400/10 hover:text-red-100"
              type="button"
              onClick={onSignOut}
            >
              Sign Out
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function getTopBarBadges({
  activeName,
  activeView,
  combatantCount,
  round,
}: {
  activeName: string;
  activeView: EncounterView;
  combatantCount: number;
  round: number;
}) {
  if (activeView === "encounters") {
    return [
      {
        label: "Local mock data",
        className: "border-slate-700 bg-slate-900",
      },
      {
        label: "Supabase not wired",
        className: "border-amber-300/25 bg-amber-300/10 text-amber-100",
      },
    ];
  }

  if (activeView === "importer") {
    return [
      {
        label: "Parser planned",
        className: "border-slate-700 bg-slate-900",
      },
      {
        label: "No external import",
        className: "border-amber-300/25 bg-amber-300/10 text-amber-100",
      },
    ];
  }

  if (activeView === "library") {
    return [
      {
        label: "Local samples",
        className: "border-slate-700 bg-slate-900",
      },
      {
        label: `${combatantCount} live combatants`,
        className: "border-cyan-400/25 bg-cyan-500/10 text-cyan-100",
      },
    ];
  }

  return [
    {
      label: `${combatantCount} combatants`,
      className: "border-slate-700 bg-slate-900",
    },
    {
      label: `Round ${round}`,
      className: "border-slate-700 bg-slate-900",
    },
    {
      label: `Active: ${activeName}`,
      className: "border-cyan-400/25 bg-cyan-500/10 text-cyan-100",
    },
  ];
}
