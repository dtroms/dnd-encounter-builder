"use client";

import { TopBar } from "./top-bar";
import { ViewTabs } from "./view-tabs";

export type EncounterView =
  | "encounters"
  | "builder"
  | "runner"
  | "library"
  | "importer";

type AppShellProps = {
  activeView: EncounterView;
  combatantCount: number;
  encounterName: string;
  round: number;
  activeName: string;
  onViewChange: (view: EncounterView) => void;
  children: React.ReactNode;
};

export function AppShell({
  activeView,
  combatantCount,
  encounterName,
  round,
  activeName,
  onViewChange,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_26%)]" />
      <div className="relative">
        <TopBar
          activeName={activeName}
          activeView={activeView}
          combatantCount={combatantCount}
          encounterName={encounterName}
          round={round}
        />
        <main className="mx-auto max-w-[1800px] px-3 pb-6 pt-3 sm:px-4 lg:px-5">
          <ViewTabs activeView={activeView} onViewChange={onViewChange} />
          <div className="mt-3">{children}</div>
        </main>
      </div>
    </div>
  );
}
