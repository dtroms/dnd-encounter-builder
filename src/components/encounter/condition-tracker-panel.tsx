import type {
  CombatantCondition,
  EncounterCombatant,
  SpellEffect,
} from "@/lib/encounter/types";
import { getHpStatus } from "@/lib/encounter/hp";
import { spellEffectOptions } from "@/lib/encounter/spell-effects";
import { EmptyState } from "./empty-state";
import { StatusBadge } from "./status-badge";
import { TypeBadge } from "./type-badge";

const conditionOptions: CombatantCondition[] = [
  "blinded",
  "charmed",
  "deafened",
  "frightened",
  "grappled",
  "incapacitated",
  "invisible",
  "paralyzed",
  "petrified",
  "poisoned",
  "prone",
  "restrained",
  "stunned",
  "unconscious",
  "concentrating",
  "hidden",
];

type ConditionTrackerPanelProps = {
  combatant: EncounterCombatant | null;
  onToggleCondition: (condition: CombatantCondition) => void;
  onToggleSpellEffect: (effect: SpellEffect) => void;
};

export function ConditionTrackerPanel({
  combatant,
  onToggleCondition,
  onToggleSpellEffect,
}: ConditionTrackerPanelProps) {
  if (!combatant) {
    return (
      <aside className="rounded-xl border border-slate-800 bg-slate-950/75 p-3">
        <EmptyState
          detail="Click a combatant row to manage its conditions and statuses here."
          title="Condition Tracker"
        />
      </aside>
    );
  }

  const hpStatus = getHpStatus(combatant.currentHp, combatant.maxHp);
  const activeSpellEffects = combatant.spellEffects ?? [];

  return (
    <aside className="rounded-xl border border-slate-800 bg-slate-950/75 p-2.5">
      <div className="border-b border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <TypeBadge type={combatant.type} />
          <StatusBadge status={hpStatus} />
        </div>
        <h2 className="mt-2 text-lg font-black leading-tight text-white">
          {combatant.displayName}
        </h2>
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          <MiniStat label="AC" value={String(combatant.armorClass)} />
          <MiniStat label="HP" value={`${combatant.currentHp}/${combatant.maxHp}`} />
          <MiniStat
            label="Init"
            value={combatant.initiative === null ? "-" : String(combatant.initiative)}
          />
        </div>
      </div>

      <section className="mt-2.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="panel-heading">Conditions</h3>
          <span className="text-[11px] font-bold text-slate-500">
            {combatant.conditions.length} active
          </span>
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-1">
          {conditionOptions.map((condition) => {
            const active = combatant.conditions.includes(condition);

            return (
              <button
                className={`h-7 rounded-md border px-1.5 text-left text-[11px] font-bold capitalize transition ${
                  active
                    ? "border-cyan-300 bg-cyan-300 text-slate-950"
                    : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-white"
                }`}
                key={condition}
                type="button"
                onClick={() => onToggleCondition(condition)}
              >
                {condition}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-3 border-t border-slate-800 pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="panel-heading">Spell Effects</h3>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              Track common spell effects on the selected combatant.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {activeSpellEffects.length} active
          </span>
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-1">
          {spellEffectOptions.map((effect) => {
            const active = activeSpellEffects.includes(effect.id);

            return (
              <button
                className={`min-h-7 rounded-md border px-1.5 py-1 text-left text-[11px] font-bold transition ${
                  active
                    ? "border-violet-200 bg-violet-300 text-slate-950"
                    : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-white"
                }`}
                key={effect.id}
                type="button"
                onClick={() => onToggleSpellEffect(effect.id)}
              >
                {effect.label}
              </button>
            );
          })}
        </div>
        <button
          className="mt-1.5 h-7 w-full rounded-md border border-dashed border-slate-700 bg-slate-950 text-[11px] font-bold text-slate-500"
          disabled
          type="button"
        >
          Custom Effect later
        </button>
      </section>
    </aside>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/75 p-1.5">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}
