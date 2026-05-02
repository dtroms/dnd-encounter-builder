import type { CombatantType } from "@/lib/encounter/types";
import { typeStyles } from "@/lib/encounter/colors";

export function TypeBadge({ type }: { type: CombatantType }) {
  const style = typeStyles[type];

  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold uppercase tracking-wide ${style.border} ${style.bg} ${style.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
