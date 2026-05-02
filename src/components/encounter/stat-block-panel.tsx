"use client";

import type { EncounterCombatant, StatBlockAction, StatBlockTrait } from "@/lib/encounter/types";
import { typeStyles } from "@/lib/encounter/sample-data";

type StatBlockPanelProps = {
  combatant: EncounterCombatant | null;
};

function TraitList({
  title,
  items,
}: {
  title: string;
  items?: Array<StatBlockTrait | StatBlockAction>;
}) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-xs font-black uppercase tracking-wide text-zinc-500">
        {title}
      </h3>
      <div className="mt-2 grid gap-2">
        {items.map((item) => (
          <div className="rounded-md bg-zinc-50 p-3" key={item.name}>
            <p className="font-bold text-zinc-950">{item.name}</p>
            <p className="mt-1 text-sm leading-6 text-zinc-700">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StatBlockPanel({ combatant }: StatBlockPanelProps) {
  if (!combatant) {
    return (
      <aside className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-black text-zinc-950">Stat Block</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Click a combatant to pin their combat notes, actions, and key numbers
          here.
        </p>
      </aside>
    );
  }

  const style = typeStyles[combatant.type];

  return (
    <aside className="max-h-[calc(100vh-8rem)] overflow-auto rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={`rounded-full border px-2 py-1 text-xs font-bold uppercase tracking-wide ${style.badge}`}
          >
            {style.label}
          </span>
          <h2 className="mt-3 text-2xl font-black leading-tight text-zinc-950">
            {combatant.displayName}
          </h2>
          <p className="mt-1 text-sm font-semibold text-zinc-500">
            {combatant.size} - {combatant.challengeRating ?? "No CR"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <strong className="rounded-md bg-zinc-950 p-3 text-lg text-white">
          AC {combatant.armorClass}
        </strong>
        <strong className="rounded-md bg-zinc-100 p-3 text-lg text-zinc-950">
          HP {combatant.currentHp}/{combatant.maxHp}
        </strong>
        <span className="rounded-md border border-zinc-200 p-3 text-sm font-bold text-zinc-700">
          Speed {combatant.speed}
        </span>
        <span className="rounded-md border border-zinc-200 p-3 text-sm font-bold text-zinc-700">
          Init {combatant.initiativeBonus >= 0 ? "+" : ""}
          {combatant.initiativeBonus}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-zinc-700">
        <p>
          <strong>Senses:</strong> {combatant.senses}
        </p>
        <p>
          <strong>Languages:</strong> {combatant.languages}
        </p>
      </div>

      <div className="mt-5 grid gap-5">
        <TraitList items={combatant.traits} title="Traits" />
        <TraitList items={combatant.actions} title="Actions" />
        <TraitList items={combatant.bonusActions} title="Bonus Actions" />
        <TraitList items={combatant.reactions} title="Reactions" />
        <TraitList items={combatant.legendaryActions} title="Legendary Actions" />
        {combatant.notes ? (
          <section>
            <h3 className="text-xs font-black uppercase tracking-wide text-zinc-500">
              Notes
            </h3>
            <p className="mt-2 rounded-md bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
              {combatant.notes}
            </p>
          </section>
        ) : null}
      </div>
    </aside>
  );
}
