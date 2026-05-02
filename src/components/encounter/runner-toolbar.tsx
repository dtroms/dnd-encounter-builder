type RunnerToolbarProps = {
  encounterName: string;
  round: number;
  turnNumber: number;
  currentName: string;
  onPrevious: () => void;
  onNext: () => void;
  onRoll: () => void;
  onSort: () => void;
  onAdd: () => void;
};

export function RunnerToolbar({
  encounterName,
  round,
  turnNumber,
  currentName,
  onPrevious,
  onNext,
  onRoll,
  onSort,
  onAdd,
}: RunnerToolbarProps) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="mr-1 truncate text-base font-black text-white md:max-w-72">
            {encounterName}
          </h2>
          <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-sm font-black text-cyan-100">
            Round {round}
          </span>
          <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-sm font-black text-slate-200">
            Turn {turnNumber}
          </span>
          <span className="min-w-0 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-sm font-bold text-cyan-100">
            Current: <span className="text-white">{currentName}</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button className="runner-button" type="button" onClick={onPrevious}>
            Prev
          </button>
          <button className="runner-button-primary" type="button" onClick={onNext}>
            Next
          </button>
          <button className="runner-button" type="button" onClick={onRoll}>
            Roll NPC Init
          </button>
          <button className="runner-button" type="button" onClick={onSort}>
            Sort
          </button>
          <button className="runner-button-gold" type="button" onClick={onAdd}>
            Add
          </button>
        </div>
      </div>
    </section>
  );
}
