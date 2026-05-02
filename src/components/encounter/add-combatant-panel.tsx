"use client";

import { useMemo, useState } from "react";
import type { CombatantType, CreatureTemplate } from "@/lib/encounter/types";
import { combatantTypeOrder } from "@/lib/encounter/colors";
import { TypeBadge } from "./type-badge";

type AddCombatantPanelProps = {
  templates: CreatureTemplate[];
  compact?: boolean;
  selectedType?: "all" | CombatantType;
  search?: string;
  onSearchChange?: (value: string) => void;
  onTypeChange?: (value: "all" | CombatantType) => void;
  onAdd: (template: CreatureTemplate, count: number) => void;
};

export function AddCombatantPanel({
  templates,
  compact = false,
  selectedType,
  search,
  onSearchChange,
  onTypeChange,
  onAdd,
}: AddCombatantPanelProps) {
  const [localSearch, setLocalSearch] = useState("");
  const [localType, setLocalType] = useState<"all" | CombatantType>("all");
  const [countById, setCountById] = useState<Record<string, number>>({});

  const query = search ?? localSearch;
  const typeFilter = selectedType ?? localType;

  const filteredTemplates = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesQuery =
        normalized.length === 0 ||
        template.name.toLowerCase().includes(normalized) ||
        template.type.toLowerCase().includes(normalized) ||
        template.tags.some((tag) => tag.toLowerCase().includes(normalized));
      const matchesType = typeFilter === "all" || template.type === typeFilter;

      return matchesQuery && matchesType;
    });
  }, [query, templates, typeFilter]);

  function setSearchValue(value: string) {
    if (onSearchChange) onSearchChange(value);
    else setLocalSearch(value);
  }

  function setTypeValue(value: "all" | CombatantType) {
    if (onTypeChange) onTypeChange(value);
    else setLocalType(value);
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-black text-white">
            {compact ? "Add During Combat" : "Creature Templates"}
          </h2>
          <p className="text-xs text-slate-400">
            Local custom samples. No official monster data.
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_9rem]">
        <input
          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
          placeholder="Search name, tag, type..."
          type="search"
          value={query}
          onChange={(event) => setSearchValue(event.target.value)}
        />
        <select
          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-sm font-bold text-white outline-none focus:border-cyan-300"
          value={typeFilter}
          onChange={(event) =>
            setTypeValue(event.target.value as "all" | CombatantType)
          }
        >
          <option value="all">All types</option>
          {combatantTypeOrder.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className={`mt-3 grid gap-1.5 ${compact ? "" : "xl:grid-cols-2"}`}>
        {filteredTemplates.map((template) => {
          const count = countById[template.id] ?? 1;

          return (
            <div
              className="rounded-lg border border-slate-800 bg-slate-900/80 p-2.5"
              key={template.id}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <TypeBadge type={template.type} />
                  <h3 className="mt-1.5 truncate text-sm font-black text-white">
                    {template.name}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] font-bold text-slate-300">
                    <span>AC {template.armorClass}</span>
                    <span>HP {template.maxHp}</span>
                    <span>Init {template.initiativeBonus >= 0 ? "+" : ""}{template.initiativeBonus}</span>
                    <span>{template.speed}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {template.tags.slice(0, compact ? 3 : 5).map((tag) => (
                      <span
                        className="rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-semibold text-slate-400"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-[4rem_1fr] gap-1.5">
                <input
                  aria-label={`${template.name} copy count`}
                  className="h-8 rounded-lg border border-slate-700 bg-slate-950 px-1 text-center text-sm font-black text-white outline-none focus:border-cyan-300"
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
                  className="h-8 rounded-lg bg-cyan-300 px-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200"
                  type="button"
                  onClick={() => onAdd(template, count)}
                >
                  Add {count > 1 ? `${count} copies` : "one"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
