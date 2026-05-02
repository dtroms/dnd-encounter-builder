import type {
  AbilityScores,
  EncounterCombatant,
  StatBlockAction,
  StatBlockTrait,
} from "@/lib/encounter/types";
import { ConditionBadges } from "./condition-badges";
import { EmptyState } from "./empty-state";
import { TypeBadge } from "./type-badge";

type StatBlockPanelProps = {
  combatant: EncounterCombatant | null;
};

export function StatBlockPanel({ combatant }: StatBlockPanelProps) {
  if (!combatant) {
    return (
      <EmptyState
        detail="Click any combat card to pin its actions, AC, HP, notes, and tags here."
        title="Select a combatant"
      />
    );
  }

  return (
    <aside className="max-h-none rounded-2xl border border-slate-800 bg-slate-950/75 p-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <TypeBadge type={combatant.type} />
          <h2 className="mt-3 text-2xl font-black leading-tight text-white">
            {combatant.displayName}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {combatant.size} - {combatant.challengeRating ?? "No CR"} -{" "}
            {combatant.speed}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat label="AC" value={String(combatant.armorClass)} />
        <Stat label="HP" value={`${combatant.currentHp}/${combatant.maxHp}`} />
        <Stat
          label="Initiative"
          value={`${combatant.initiativeBonus >= 0 ? "+" : ""}${combatant.initiativeBonus}`}
        />
        <Stat label="Speed" value={combatant.speed} />
      </div>

      <AbilityGrid scores={combatant.abilityScores} />

      <div className="mt-4 grid gap-2 text-sm text-slate-400">
        <p>
          <strong className="text-slate-300">Senses:</strong>{" "}
          {combatant.senses}
        </p>
        <p>
          <strong className="text-slate-300">Languages:</strong>{" "}
          {combatant.languages}
        </p>
      </div>

      <section className="mt-4">
        <h3 className="panel-heading">Conditions</h3>
        <div className="mt-2">
          <ConditionBadges conditions={combatant.conditions} />
        </div>
      </section>

      <div className="mt-5 grid gap-5">
        <DetailList items={combatant.actions} title="Actions" />
        <DetailList items={combatant.bonusActions} title="Bonus Actions" />
        <DetailList items={combatant.reactions} title="Reactions" />
        <DetailList items={combatant.legendaryActions} title="Legendary Actions" />
        <DetailList items={combatant.traits} title="Traits" />
      </div>

      {combatant.notes ? (
        <section className="mt-5">
          <h3 className="panel-heading">Notes</h3>
          <p className="mt-2 rounded-xl border border-slate-800 bg-slate-900/75 p-3 text-sm leading-6 text-slate-300">
            {combatant.notes}
          </p>
        </section>
      ) : null}

      <section className="mt-5">
        <h3 className="panel-heading">Tags</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {combatant.tags.map((tag) => (
            <span
              className="rounded-full bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-400"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      </section>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function AbilityGrid({ scores }: { scores: AbilityScores }) {
  return (
    <section className="mt-4">
      <h3 className="panel-heading">Ability Scores</h3>
      <div className="mt-2 grid grid-cols-6 gap-1.5">
        {Object.entries(scores).map(([ability, score]) => (
          <div
            className="rounded-lg border border-slate-800 bg-slate-900/75 p-2 text-center"
            key={ability}
          >
            <p className="text-[10px] font-black uppercase text-slate-500">
              {ability}
            </p>
            <p className="text-base font-black text-white">{score}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DetailList({
  title,
  items,
}: {
  title: string;
  items?: Array<StatBlockAction | StatBlockTrait>;
}) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="panel-heading">{title}</h3>
      <div className="mt-2 grid gap-2">
        {items.map((item) => (
          <div
            className="rounded-xl border border-slate-800 bg-slate-900/75 p-3"
            key={item.name}
          >
            <p className="font-black text-white">{item.name}</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
