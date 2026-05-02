"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CombatGroup, EncounterCombatant } from "@/lib/encounter/types";
import { getCombatGroupColorClass } from "@/lib/encounter/colors";

type CombatGroupPickerProps = {
  combatant: EncounterCombatant;
  compact?: boolean;
  groups: CombatGroup[];
  variant?: "chip" | "menu";
  onUpdateGroup: (updates: {
    combatGroupLabel?: string;
    combatGroupColor?: string;
  }) => void;
};

export function CombatGroupPicker({
  combatant,
  compact = false,
  groups,
  variant = "chip",
  onUpdateGroup,
}: CombatGroupPickerProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const colorClass =
    getCombatGroupColorClass(combatant.combatGroupColor) ?? "bg-slate-600";
  const label =
    combatant.combatGroupColor && combatant.combatGroupColor !== "None"
      ? combatant.combatGroupLabel || combatant.combatGroupColor
      : "No Group";

  useEffect(() => {
    if (!open) {
      return;
    }

    function updatePosition() {
      const trigger = triggerRef.current;

      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const menuWidth = 224;
      const padding = 8;
      const left =
        variant === "menu"
          ? Math.min(
              Math.max(padding, rect.right - menuWidth),
              window.innerWidth - menuWidth - padding,
            )
          : Math.min(
              Math.max(padding, rect.left),
              window.innerWidth - menuWidth - padding,
            );
      const top = variant === "menu" ? rect.top : rect.bottom + padding;

      setMenuPosition({ left, top: Math.max(padding, top) });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, variant]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const menu = open ? (
    <div
      className="fixed z-[9999] w-56 rounded-xl border border-slate-600 bg-slate-950 p-2 shadow-2xl shadow-black/80 ring-1 ring-cyan-300/10"
      ref={menuRef}
      style={{ left: menuPosition.left, top: menuPosition.top }}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <p className="px-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
        Combat Group
      </p>
      <div className="mt-1 grid gap-1">
        <button
          className="flex h-8 items-center gap-2 rounded-lg px-2 text-left text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white"
          type="button"
          onClick={() => {
            onUpdateGroup({
              combatGroupLabel: "",
              combatGroupColor: "None",
            });
            setOpen(false);
          }}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
          Ungrouped / No Group
        </button>
        {groups.map((group) => (
          <button
            className="flex h-8 items-center gap-2 rounded-lg px-2 text-left text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white"
            key={group.id}
            type="button"
            onClick={() => {
              onUpdateGroup({
                combatGroupLabel: group.name,
                combatGroupColor: group.color,
              });
              setOpen(false);
            }}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                getCombatGroupColorClass(group.color) ?? "bg-slate-500"
              }`}
            />
            <span className="truncate">{group.name}</span>
          </button>
        ))}
      </div>
      {groups.length === 0 ? (
        <p className="mt-2 rounded-lg border border-dashed border-slate-700 px-2 py-2 text-xs leading-5 text-slate-500">
          Create groups in the Combat Groups card.
        </p>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="relative">
      <button
        aria-label={`Change combat group for ${combatant.displayName}`}
        title="Change combat group"
        className={
          variant === "menu"
            ? "flex h-14 w-8 items-center justify-center rounded-r-xl border-l border-slate-800 bg-slate-950/70 text-lg font-black leading-none text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
            : `inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 font-black text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-300/15 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30 ${
                compact
                  ? "h-7 max-w-36 px-2 text-[10px]"
                  : "h-6 max-w-32 px-1.5 text-[10px]"
              }`
        }
        ref={triggerRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        {variant === "menu" ? (
          <span aria-hidden="true" className="-mt-1 tracking-[-0.18em]">
            ...
          </span>
        ) : (
          <>
            <span className={`h-1.5 w-1.5 rounded-full ${colorClass}`} />
            <span className="truncate">{label}</span>
            <span className="text-[9px] text-cyan-200/80">v</span>
          </>
        )}
      </button>
      {menu && typeof document !== "undefined"
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}
