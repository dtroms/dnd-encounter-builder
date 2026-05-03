import type { EncounterView } from "./app-shell";

const tabs: Array<{ key: EncounterView; label: string; detail: string }> = [
  { key: "encounters", label: "Encounters", detail: "Saved games" },
  { key: "builder", label: "Builder", detail: "Prep roster" },
  { key: "runner", label: "Runner", detail: "Live combat" },
  { key: "library", label: "Library", detail: "Creatures" },
  { key: "importer", label: "Importer", detail: "Future parser" },
];

export function ViewTabs({
  activeView,
  onViewChange,
}: {
  activeView: EncounterView;
  onViewChange: (view: EncounterView) => void;
}) {
  return (
    <nav className="grid gap-1.5 rounded-xl border border-slate-800 bg-slate-950/70 p-1.5 md:inline-grid md:grid-cols-5">
      {tabs.map((tab) => (
        <button
          className={`rounded-lg px-3 py-2 text-left transition ${
            activeView === tab.key
              ? "bg-cyan-400 text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.16)]"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
          key={tab.key}
          type="button"
          onClick={() => onViewChange(tab.key)}
        >
          <span className="block text-xs font-black">{tab.label}</span>
          <span className="mt-0.5 block text-[11px] font-semibold opacity-70">
            {tab.detail}
          </span>
        </button>
      ))}
    </nav>
  );
}
