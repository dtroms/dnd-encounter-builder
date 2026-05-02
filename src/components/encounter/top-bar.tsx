type TopBarProps = {
  encounterName: string;
  combatantCount: number;
  round: number;
  activeName: string;
};

export function TopBar({
  encounterName,
  combatantCount,
  round,
  activeName,
}: TopBarProps) {
  return (
    <header className="border-b border-slate-800/90 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5 lg:px-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            D&D Encounter Builder
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-normal text-white md:text-3xl">
            {encounterName}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-bold text-slate-300">
          <span className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2">
            {combatantCount} combatants
          </span>
          <span className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2">
            Round {round}
          </span>
          <span className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-cyan-100">
            Active: {activeName}
          </span>
        </div>
      </div>
    </header>
  );
}
