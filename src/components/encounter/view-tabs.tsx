import type { EncounterView } from "./app-shell";

const tabs: Array<{ key: EncounterView; label: string; detail: string }> = [
  { key: "builder", label: "Encounter Builder", detail: "Prep and roster" },
  { key: "runner", label: "Encounter Runner", detail: "Live combat" },
  { key: "library", label: "Library Preview", detail: "Sample creatures" },
];

export function ViewTabs({
  activeView,
  onViewChange,
}: {
  activeView: EncounterView;
  onViewChange: (view: EncounterView) => void;
}) {
  return (
    <nav className="grid gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-2 md:inline-grid md:grid-cols-3">
      {tabs.map((tab) => (
        <button
          className={`rounded-xl px-4 py-3 text-left transition ${
            activeView === tab.key
              ? "bg-cyan-400 text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.16)]"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
          key={tab.key}
          type="button"
          onClick={() => onViewChange(tab.key)}
        >
          <span className="block text-sm font-black">{tab.label}</span>
          <span className="mt-0.5 block text-xs font-semibold opacity-70">
            {tab.detail}
          </span>
        </button>
      ))}
    </nav>
  );
}
