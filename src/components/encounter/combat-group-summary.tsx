import type { EncounterCombatant } from "@/lib/encounter/types";
import { getCombatGroupColorClass } from "@/lib/encounter/colors";

type CombatGroupSummaryProps = {
  combatants: EncounterCombatant[];
};

export function CombatGroupSummary({ combatants }: CombatGroupSummaryProps) {
  const groups = combatants.reduce<Record<string, { color?: string; count: number }>>(
    (acc, combatant) => {
      const hasGroup =
        combatant.combatGroupColor && combatant.combatGroupColor !== "None";
      const label = hasGroup
        ? combatant.combatGroupLabel || combatant.combatGroupColor || "Grouped"
        : "Ungrouped";

      acc[label] = {
        color: hasGroup ? combatant.combatGroupColor : "None",
        count: (acc[label]?.count ?? 0) + 1,
      };

      return acc;
    },
    {},
  );

  return (
    <section className="mt-2.5 rounded-lg border border-slate-800 bg-slate-900/50 p-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="panel-heading">Combat Groups</h3>
        <span className="text-[11px] font-bold text-slate-500">
          {Object.keys(groups).length}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {Object.entries(groups).map(([label, group]) => {
          const colorClass =
            getCombatGroupColorClass(group.color) ?? "bg-slate-600";

          return (
            <span
              className="inline-flex h-6 items-center gap-1 rounded-full border border-slate-700 bg-slate-950 px-2 text-[11px] font-bold text-slate-300"
              key={label}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${colorClass}`} />
              {label}
              <span className="text-slate-500">{group.count}</span>
            </span>
          );
        })}
      </div>
    </section>
  );
}
