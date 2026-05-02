import type { EncounterCombatant } from "@/lib/encounter/types";

export function LairActionsPanel({
  combatants,
}: {
  combatants: EncounterCombatant[];
}) {
  const lairCombatants = combatants.filter(
    (combatant) => combatant.lairActions && combatant.lairActions.length > 0,
  );

  if (lairCombatants.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">
          Lair Actions
        </h3>
        <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[11px] font-black text-amber-100">
          Initiative 20
        </span>
      </div>
      <div className="mt-2.5 grid gap-2">
        {lairCombatants.map((combatant) => (
          <div
            className="rounded-lg border border-amber-300/15 bg-slate-950/70 p-2.5"
            key={combatant.combatantId}
          >
            <p className="truncate text-sm font-black text-amber-100">
              {combatant.displayName}
            </p>
            <div className="mt-2 grid gap-2">
              {combatant.lairActions?.map((action) => (
                <div key={action.name}>
                  <p className="text-sm font-black text-white">{action.name}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-300">
                    {action.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
