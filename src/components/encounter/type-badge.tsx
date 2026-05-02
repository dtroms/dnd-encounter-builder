import type { CombatantType } from "@/lib/encounter/types";
import { typeStyles } from "@/lib/encounter/colors";

export function TypeBadge({ type }: { type: CombatantType }) {
  const style = typeStyles[type];

  return (
    <span
      className={`inline-flex h-5 items-center gap-1 rounded-full border px-1.5 text-[10px] font-bold uppercase tracking-wide ${style.border} ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
