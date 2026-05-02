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
    <section className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            Live Runner
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">{encounterName}</h2>
          <p className="mt-1 text-sm text-slate-400">
            Round {round} - Turn {turnNumber} - Current:{" "}
            <span className="font-bold text-slate-200">{currentName}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="runner-button" type="button" onClick={onPrevious}>
            Previous Turn
          </button>
          <button className="runner-button-primary" type="button" onClick={onNext}>
            Next Turn
          </button>
          <button className="runner-button" type="button" onClick={onRoll}>
            Roll NPC/Monster Initiative
          </button>
          <button className="runner-button" type="button" onClick={onSort}>
            Sort Initiative
          </button>
          <button className="runner-button-gold" type="button" onClick={onAdd}>
            Add Combatant
          </button>
        </div>
      </div>
    </section>
  );
}
