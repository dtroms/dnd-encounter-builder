"use client";

import { useMemo, useState } from "react";
import type { CreatureTemplate } from "@/lib/encounter/types";
import { typeStyles } from "@/lib/encounter/sample-data";

type AddCombatantPanelProps = {
  templates: CreatureTemplate[];
  compact?: boolean;
  onAdd: (template: CreatureTemplate, count: number) => void;
};

export function AddCombatantPanel({
  templates,
  compact = false,
  onAdd,
}: AddCombatantPanelProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [countById, setCountById] = useState<Record<string, number>>({});

  const filteredTemplates = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesQuery =
        normalized.length === 0 ||
        template.name.toLowerCase().includes(normalized) ||
        template.tags.some((tag) => tag.toLowerCase().includes(normalized));
      const matchesType = typeFilter === "all" || template.type === typeFilter;

      return matchesQuery && matchesType;
    });
  }, [query, templates, typeFilter]);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-zinc-950">
            {compact ? "Fast Add" : "Creature Repository"}
          </h2>
          <p className="text-sm text-zinc-600">
            Sample local creatures only. No external sources.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_9rem]">
        <input
          className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-900"
          placeholder="Search names or tags"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="all">All types</option>
          <option value="pc">PC</option>
          <option value="ally">Ally</option>
          <option value="enemy">Enemy</option>
          <option value="boss">Boss</option>
          <option value="summon">Summon</option>
          <option value="neutral">Neutral</option>
        </select>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "" : "lg:grid-cols-2"}`}>
        {filteredTemplates.map((template) => {
          const style = typeStyles[template.type];
          const count = countById[template.id] ?? 1;

          return (
            <div
              className={`rounded-lg border-l-4 border-zinc-200 bg-zinc-50 p-3 ${style.accent}`}
              key={template.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-bold uppercase tracking-wide ${style.badge}`}
                    >
                      {style.label}
                    </span>
                    <span className="text-xs font-bold text-zinc-500">
                      AC {template.armorClass} / HP {template.maxHp}
                    </span>
                  </div>
                  <h3 className="mt-2 truncate text-base font-black text-zinc-950">
                    {template.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-600">
                    {template.traits[0]?.description ?? template.notes}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-[5rem_1fr] gap-2">
                <input
                  aria-label={`${template.name} copy count`}
                  className="h-10 rounded-md border border-zinc-300 bg-white px-2 text-center font-bold text-zinc-950"
                  min={1}
                  type="number"
                  value={count}
                  onChange={(event) =>
                    setCountById((current) => ({
                      ...current,
                      [template.id]: Math.max(1, Number(event.target.value)),
                    }))
                  }
                />
                <button
                  className="h-10 rounded-md bg-zinc-950 px-3 text-sm font-bold text-white transition hover:bg-zinc-800"
                  type="button"
                  onClick={() => onAdd(template, count)}
                >
                  Add {count > 1 ? `${count} copies` : "creature"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
