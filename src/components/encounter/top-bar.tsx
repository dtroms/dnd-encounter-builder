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
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4 lg:px-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">
            D&D Encounter Builder
          </p>
          <h1 className="mt-0.5 text-xl font-black tracking-normal text-white md:text-2xl">
            {encounterName}
          </h1>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs font-bold text-slate-300">
          <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5">
            {combatantCount} combatants
          </span>
          <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5">
            Round {round}
          </span>
          <span className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1.5 text-cyan-100">
            Active: {activeName}
          </span>
        </div>
      </div>
    </header>
  );
}
