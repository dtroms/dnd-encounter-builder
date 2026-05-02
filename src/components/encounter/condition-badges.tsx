import type { CombatantCondition } from "@/lib/encounter/types";

export function ConditionBadges({
  conditions,
  emptyLabel,
}: {
  conditions: CombatantCondition[];
  emptyLabel?: string;
}) {
  if (conditions.length === 0) {
    return emptyLabel ? (
      <span className="text-xs font-medium text-slate-500">{emptyLabel}</span>
    ) : null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {conditions.map((condition) => (
        <span
          className="rounded-full border border-slate-600 bg-slate-950 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-300"
          key={condition}
        >
          {condition}
        </span>
      ))}
    </div>
  );
}
