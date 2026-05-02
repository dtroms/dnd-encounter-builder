import type { HpStatus } from "@/lib/encounter/hp";

const statusStyles: Record<HpStatus, string> = {
  Healthy: "border-emerald-400/35 bg-emerald-500/10 text-emerald-200",
  Bloodied: "border-amber-400/35 bg-amber-500/10 text-amber-200",
  Critical: "border-orange-400/40 bg-orange-500/10 text-orange-200",
  Down: "border-rose-400/40 bg-rose-500/10 text-rose-200",
};

export function StatusBadge({ status }: { status: HpStatus }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-bold uppercase tracking-wide ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
