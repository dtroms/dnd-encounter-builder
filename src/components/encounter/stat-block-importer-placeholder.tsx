"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  AbilityScores,
  CombatantType,
  MonsterType,
  StatBlockAction,
} from "@/lib/encounter/types";
import type { LibraryCreature } from "@/lib/encounter/library-sample-data";
import {
  parseStatBlock,
  type ParsedCreatureDraft,
  type StatBlockParseResult,
} from "@/lib/encounter/stat-block-parser";

type ImporterTab = "paste" | "srd" | "history";

const monsterTypeOptions: MonsterType[] = [
  "Aberration",
  "Beast",
  "Celestial",
  "Construct",
  "Dragon",
  "Elemental",
  "Fey",
  "Fiend",
  "Giant",
  "Humanoid",
  "Monstrosity",
  "Ooze",
  "Plant",
  "Undead",
  "Custom / Other",
  "Unknown / Unset",
];

const combatRoleOptions: CombatantType[] = [
  "enemy",
  "boss",
  "pc",
  "ally",
  "summon",
  "minion",
  "neutral",
];

const sizeOptions = [
  "Tiny",
  "Small",
  "Medium",
  "Large",
  "Huge",
  "Gargantuan",
];

export function StatBlockImporterPlaceholder({
  onSaveCreature,
}: {
  onSaveCreature?: (creature: LibraryCreature) => void;
}) {
  const [activeTab, setActiveTab] = useState<ImporterTab>("paste");
  const [rawText, setRawText] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [parseResult, setParseResult] = useState<StatBlockParseResult | null>(
    null,
  );
  const [draft, setDraft] = useState<LibraryCreature | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [srdPreviewOpen, setSrdPreviewOpen] = useState(false);

  const missingFields = useMemo(() => {
    if (!draft) {
      return [];
    }

    return [
      !draft.name.trim() ? "name" : null,
      draft.armorClass <= 0 ? "armor class" : null,
      draft.maxHp <= 0 ? "hit points" : null,
      !draft.challengeRating?.trim() ? "challenge rating" : null,
      !draft.monsterType || draft.monsterType === "Unknown / Unset"
        ? "creature type"
        : null,
    ].filter(Boolean) as string[];
  }, [draft]);

  function parsePastedText() {
    const result = parseStatBlock(rawText);
    setParseResult(result);
    setDraft(
      buildLibraryCreatureFromDraft(
        result.draft,
        sourceName,
        sourceUrl,
        rawText,
      ),
    );
    setSavedMessage("");
  }

  function patchDraft(updates: Partial<LibraryCreature>) {
    setDraft((current) => (current ? { ...current, ...updates } : current));
  }

  function patchScores(scores: Partial<AbilityScores>) {
    setDraft((current) =>
      current
        ? {
            ...current,
            abilityScores: { ...current.abilityScores, ...scores },
          }
        : current,
    );
  }

  function saveToLibrary() {
    if (!draft || !onSaveCreature || missingFields.length) {
      return;
    }

    const normalized: LibraryCreature = {
      ...draft,
      id: `imported-${slugify(draft.name)}-${Date.now()}`,
      actions: cleanEntries(draft.actions),
      bonusActions: cleanEntries(draft.bonusActions),
      lairActions: cleanEntries(draft.lairActions),
      legendaryActions: cleanEntries(draft.legendaryActions),
      notes: draft.notes?.trim(),
      reactions: cleanEntries(draft.reactions),
      sourceName: draft.sourceName.trim() || "User Provided Paste",
      sourceType: "imported",
      sourceUrl: draft.sourceUrl?.trim() || undefined,
      tags: draft.tags.map((tag) => tag.trim()).filter(Boolean),
      traits: cleanEntries(draft.traits),
    };

    onSaveCreature(normalized);
    setDraft(normalized);
    setSavedMessage(`${normalized.name} was saved to the local Creature Library.`);
  }

  return (
    <section className="space-y-4">
      <header className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">
              Stat Block Importer
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Import SRD monsters or paste your own stat blocks into your
              Creature Library.
            </p>
          </div>
          <span className="rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-100">
            Local review only
          </span>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <MethodTab
            active={activeTab === "paste"}
            label="Paste Stat Block"
            text="Paste user-provided text, parse, review, then save locally."
            onClick={() => setActiveTab("paste")}
          />
          <MethodTab
            active={activeTab === "srd"}
            label="Import SRD Monsters"
            text="Plan a CC-SRD import from the Tabyltop repository."
            onClick={() => setActiveTab("srd")}
          />
          <MethodTab
            active={activeTab === "history"}
            label="Import History"
            text="Placeholder for saved import attempts and parser status."
            onClick={() => setActiveTab("history")}
          />
        </div>
      </header>

      {activeTab === "paste" ? (
        <PasteImportWorkflow
          draft={draft}
          missingFields={missingFields}
          parseResult={parseResult}
          rawText={rawText}
          savedMessage={savedMessage}
          sourceName={sourceName}
          sourceUrl={sourceUrl}
          onParse={parsePastedText}
          onPatchDraft={patchDraft}
          onPatchScores={patchScores}
          onRawTextChange={setRawText}
          onSave={saveToLibrary}
          onSourceNameChange={setSourceName}
          onSourceUrlChange={setSourceUrl}
        />
      ) : null}

      {activeTab === "srd" ? (
        <SrdImportPlanning
          previewOpen={srdPreviewOpen}
          onPreview={() => setSrdPreviewOpen(true)}
        />
      ) : null}

      {activeTab === "history" ? <ImportHistoryPlaceholder /> : null}

      <SafetyNote />
    </section>
  );
}

function MethodTab({
  active,
  label,
  text,
  onClick,
}: {
  active: boolean;
  label: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-xl border p-3 text-left transition ${
        active
          ? "border-cyan-300/60 bg-cyan-300/10"
          : "border-slate-800 bg-slate-900/65 hover:border-slate-600"
      }`}
      type="button"
      onClick={onClick}
    >
      <span
        className={`text-sm font-black ${
          active ? "text-cyan-100" : "text-white"
        }`}
      >
        {label}
      </span>
      <span className="mt-1 block text-xs leading-5 text-slate-400">
        {text}
      </span>
    </button>
  );
}

function PasteImportWorkflow({
  draft,
  missingFields,
  parseResult,
  rawText,
  savedMessage,
  sourceName,
  sourceUrl,
  onParse,
  onPatchDraft,
  onPatchScores,
  onRawTextChange,
  onSave,
  onSourceNameChange,
  onSourceUrlChange,
}: {
  draft: LibraryCreature | null;
  missingFields: string[];
  parseResult: StatBlockParseResult | null;
  rawText: string;
  savedMessage: string;
  sourceName: string;
  sourceUrl: string;
  onParse: () => void;
  onPatchDraft: (updates: Partial<LibraryCreature>) => void;
  onPatchScores: (scores: Partial<AbilityScores>) => void;
  onRawTextChange: (value: string) => void;
  onSave: () => void;
  onSourceNameChange: (value: string) => void;
  onSourceUrlChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
        <StepLabel step="1" text="Source / Input" />
        <h3 className="mt-2 text-xl font-black text-white">
          Paste Stat Block
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Paste content you have the right to use. The parser is a helper, not
          an authority, so review every field before saving.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <TextInput
            label="Source Name Optional"
            value={sourceName}
            onChange={onSourceNameChange}
            placeholder="Homebrew notes, player handout, etc."
          />
          <TextInput
            label="Source URL Optional"
            value={sourceUrl}
            onChange={onSourceUrlChange}
            placeholder="https://..."
          />
        </div>

        <label className="mt-3 block text-xs font-black uppercase tracking-wide text-slate-500">
          Raw Stat Block Text
        </label>
        <textarea
          className="mt-2 min-h-80 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
          value={rawText}
          placeholder={"Name\nMedium Humanoid, any alignment\nArmor Class 14\nHit Points 27\nSpeed 30 ft.\n\nSTR DEX CON INT WIS CHA\n10 14 12 11 10 13\n\nActions\nShortsword. Melee Weapon Attack: describe the attack."}
          onChange={(event) => onRawTextChange(event.target.value)}
        />
        <button
          className="mt-3 rounded-lg border border-cyan-300/50 bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
          disabled={!rawText.trim()}
          type="button"
          onClick={onParse}
        >
          Parse Stat Block
        </button>
      </section>

      <ReviewPanel
        draft={draft}
        missingFields={missingFields}
        parseResult={parseResult}
        savedMessage={savedMessage}
        onPatchDraft={onPatchDraft}
        onPatchScores={onPatchScores}
        onSave={onSave}
      />
    </div>
  );
}

function ReviewPanel({
  draft,
  missingFields,
  parseResult,
  savedMessage,
  onPatchDraft,
  onPatchScores,
  onSave,
}: {
  draft: LibraryCreature | null;
  missingFields: string[];
  parseResult: StatBlockParseResult | null;
  savedMessage: string;
  onPatchDraft: (updates: Partial<LibraryCreature>) => void;
  onPatchScores: (scores: Partial<AbilityScores>) => void;
  onSave: () => void;
}) {
  const warnings = parseResult?.warnings ?? [];

  if (!draft) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
        <StepLabel step="2" text="Review / Validate" />
        <div className="mt-12 rounded-xl border border-dashed border-slate-700 bg-slate-900/45 p-6 text-center">
          <h3 className="text-lg font-black text-white">
            Review Parsed Creature
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Paste a stat block and run the parser. Detected fields, warnings,
            and editable review controls will appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <StepLabel step="2" text="Review / Validate" />
          <h3 className="mt-2 text-xl font-black text-white">
            Review Parsed Creature
          </h3>
        </div>
        {parseResult ? (
          <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-slate-300">
            {parseResult.confidence} confidence
          </span>
        ) : null}
      </div>

      {warnings.length || missingFields.length ? (
        <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-amber-100">
            Review Needed
          </p>
          <ul className="mt-2 space-y-1 text-sm leading-5 text-amber-50/85">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
            {missingFields.length ? (
              <li>Required fields missing: {missingFields.join(", ")}.</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextInput
          label="Name Required"
          value={draft.name}
          onChange={(name) => onPatchDraft({ name })}
        />
        <SelectInput
          label="Creature Type Required"
          value={draft.monsterType ?? "Unknown / Unset"}
          onChange={(monsterType) =>
            onPatchDraft({ monsterType: monsterType as MonsterType })
          }
        >
          {monsterTypeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectInput>
        <SelectInput
          label="Combat Role Required"
          value={draft.type}
          onChange={(type) => onPatchDraft({ type: type as CombatantType })}
        >
          {combatRoleOptions.map((option) => (
            <option key={option} value={option}>
              {labelize(option)}
            </option>
          ))}
        </SelectInput>
        <SelectInput
          label="Size"
          value={draft.size}
          onChange={(size) => onPatchDraft({ size })}
        >
          {sizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectInput>
        <NumberInput
          label="Armor Class Required"
          value={draft.armorClass}
          onChange={(armorClass) => onPatchDraft({ armorClass })}
        />
        <NumberInput
          label="Hit Points Required"
          value={draft.maxHp}
          onChange={(maxHp) => onPatchDraft({ maxHp })}
        />
        <TextInput
          label="Challenge Rating Required"
          value={draft.challengeRating ?? ""}
          onChange={(challengeRating) => onPatchDraft({ challengeRating })}
        />
        <NumberInput
          label="Initiative Bonus"
          value={draft.initiativeBonus}
          onChange={(initiativeBonus) => onPatchDraft({ initiativeBonus })}
        />
        <TextInput
          label="Speed"
          value={draft.speed}
          onChange={(speed) => onPatchDraft({ speed })}
        />
        <TextInput
          label="Senses"
          value={draft.senses}
          onChange={(senses) => onPatchDraft({ senses })}
        />
        <TextInput
          label="Languages"
          value={draft.languages}
          onChange={(languages) => onPatchDraft({ languages })}
        />
        <TextInput
          label="Tags"
          value={draft.tags.join(", ")}
          onChange={(value) => onPatchDraft({ tags: splitTags(value) })}
        />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {Object.entries(draft.abilityScores).map(([key, value]) => (
          <NumberInput
            key={key}
            label={key.toUpperCase()}
            value={value}
            onChange={(score) => onPatchScores({ [key]: score })}
          />
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <EntryTextArea
          label="Traits"
          value={draft.traits}
          onChange={(traits) => onPatchDraft({ traits })}
        />
        <EntryTextArea
          label="Actions"
          value={draft.actions}
          onChange={(actions) => onPatchDraft({ actions })}
        />
        <EntryTextArea
          label="Bonus Actions"
          value={draft.bonusActions ?? []}
          onChange={(bonusActions) => onPatchDraft({ bonusActions })}
        />
        <EntryTextArea
          label="Reactions"
          value={draft.reactions ?? []}
          onChange={(reactions) => onPatchDraft({ reactions })}
        />
        <EntryTextArea
          label="Legendary Actions"
          value={draft.legendaryActions ?? []}
          onChange={(legendaryActions) => onPatchDraft({ legendaryActions })}
        />
        <EntryTextArea
          label="Lair Actions"
          value={draft.lairActions ?? []}
          onChange={(lairActions) => onPatchDraft({ lairActions })}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextArea
          label="Notes"
          value={draft.notes ?? ""}
          onChange={(notes) => onPatchDraft({ notes })}
        />
        <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            Source Metadata
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-300">
            Source: {draft.sourceName}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-300">
            Method: paste review
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-300">
            License: {draft.licenseName}
          </p>
          {draft.sourceUrl ? (
            <p className="mt-1 break-all text-sm font-semibold text-slate-400">
              URL: {draft.sourceUrl}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <p className="text-sm font-semibold text-slate-400">
          {savedMessage ||
            "Save adds this reviewed creature to the local Library and Builder for this session."}
        </p>
        <button
          className="rounded-lg border border-emerald-300/50 bg-emerald-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
          disabled={missingFields.length > 0}
          type="button"
          onClick={onSave}
        >
          Save to Library
        </button>
      </div>
    </section>
  );
}

function SrdImportPlanning({
  previewOpen,
  onPreview,
}: {
  previewOpen: boolean;
  onPreview: () => void;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
      <StepLabel step="1" text="Planned SRD Source" />
      <div className="mt-3 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-100">
            Creative Commons SRD
          </p>
          <h3 className="mt-2 text-xl font-black text-white">
            Tabyltop CC-SRD
          </h3>
          <dl className="mt-4 grid gap-3 text-sm">
            <SourceFact label="GitHub" value="github.com/Tabyltop/CC-SRD" />
            <SourceFact label="Document" value="SRD 5.1" />
            <SourceFact label="License" value="CC-BY-4.0" />
            <SourceFact label="Source Type" value="srd" />
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-emerald-300/50 bg-emerald-300 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-200"
              type="button"
              onClick={onPreview}
            >
              Preview SRD Import
            </button>
            <button
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-500"
              disabled
              type="button"
            >
              Import All later
            </button>
            <button
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-500"
              disabled
              type="button"
            >
              Select Monsters later
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/55 p-4">
          <h3 className="text-lg font-black text-white">
            Planned Adapter Workflow
          </h3>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            <li>1. Obtain a reviewed CC-SRD monster JSON file or local adapter output.</li>
            <li>2. Normalize records into the app creature template shape.</li>
            <li>3. Validate AC, HP, initiative bonus, CR, actions, license, and attribution.</li>
            <li>4. Generate an import preview with warnings and missing fields.</li>
            <li>5. Save selected creatures only after review.</li>
          </ol>
          <p className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50/90">
            No GitHub fetch or bulk import is performed in this UI pass. Early
            beta should prefer a curated local import file or adapter script
            with reviewed output.
          </p>
        </div>
      </div>

      {previewOpen ? (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/55 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            Mock Import Preview
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <PreviewItem
              label="Schema Check"
              text="Adapter output would be checked for required creature fields."
            />
            <PreviewItem
              label="Attribution"
              text="Source, license, URL, and attribution metadata would be preserved."
            />
            <PreviewItem
              label="Review Gate"
              text="Records would remain drafts until approved for the Library."
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ImportHistoryPlaceholder() {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
      <StepLabel step="Later" text="Import History" />
      <div className="mt-8 rounded-xl border border-dashed border-slate-700 bg-slate-900/45 p-6 text-center">
        <h3 className="text-lg font-black text-white">
          Import History Comes Later
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Import history will show pasted stat blocks, parser status, source
          metadata, and saved creatures after database persistence exists. No
          database wiring is included yet.
        </p>
      </div>
    </section>
  );
}

function SafetyNote() {
  return (
    <aside className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        Source and License Boundaries
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Use only content you have the right to use. SRD Creative Commons imports
        should include attribution. Official non-SRD D&D monsters are not
        bundled with this app. Pasted imports are treated as user-provided
        content, and D&D Beyond link scraping is not implemented.
      </p>
    </aside>
  );
}

function StepLabel({ step, text }: { step: string; text: string }) {
  return (
    <span className="rounded-md bg-cyan-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-200">
      Step {step}: {text}
    </span>
  );
}

function SourceFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-300/15 bg-slate-950/50 px-3 py-2">
      <dt className="text-xs font-black uppercase tracking-wide text-emerald-100/70">
        {label}
      </dt>
      <dd className="text-right text-sm font-black text-white">{value}</dd>
    </div>
  );
}

function PreviewItem({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/75 p-3">
      <h4 className="text-sm font-black text-white">{label}</h4>
      <p className="mt-1 text-sm leading-5 text-slate-400">{text}</p>
    </div>
  );
}

function TextInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        className="mt-1 h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        className="mt-1 h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-300"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function SelectInput({
  children,
  label,
  value,
  onChange,
}: {
  children: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        className="mt-1 h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-300"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <textarea
        className="mt-1 min-h-36 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm leading-6 text-white outline-none transition focus:border-cyan-300"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function EntryTextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: StatBlockAction[];
  onChange: (value: StatBlockAction[]) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <textarea
        className="mt-1 min-h-32 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
        placeholder="Name: Description"
        value={entriesToText(value)}
        onChange={(event) => onChange(textToEntries(event.target.value))}
      />
    </label>
  );
}

function buildLibraryCreatureFromDraft(
  draft: ParsedCreatureDraft,
  sourceName: string,
  sourceUrl: string,
  rawText: string,
): LibraryCreature {
  return {
    accentColor: "Cyan",
    actions: draft.actions.length
      ? draft.actions
      : [{ name: "Imported Action", description: "" }],
    armorClass: draft.armorClass ?? 10,
    attribution: undefined,
    autoRollEligible: draft.type !== "pc",
    bonusActions: draft.bonusActions,
    challengeRating: draft.challengeRating || "0",
    abilityScores: draft.abilityScores,
    id: `import-draft-${Date.now()}`,
    importMethod: "paste",
    initiativeBonus: draft.initiativeBonus ?? 0,
    lairActions: draft.lairActions,
    languages: draft.languages || "None",
    legendaryActions: draft.legendaryActions,
    licenseName: "user-provided/private",
    maxHp: draft.maxHp ?? 1,
    monsterType: draft.monsterType,
    name: draft.name,
    notes: rawText
      ? `${draft.notes}\n\nRaw pasted text is held only in this local review draft.`
      : draft.notes,
    reactions: draft.reactions,
    savingThrows: draft.savingThrows,
    senses: draft.senses || "passive Perception 10",
    size: draft.size,
    skills: draft.skills,
    sourceName: sourceName.trim() || "User Provided Paste",
    sourceType: "imported",
    sourceUrl: sourceUrl.trim() || undefined,
    speed: draft.speed || "30 ft.",
    tags: draft.tags,
    traits: draft.traits,
    type: draft.type,
  };
}

function entriesToText(entries: StatBlockAction[]) {
  return entries
    .map((entry) =>
      entry.name ? `${entry.name}: ${entry.description}` : entry.description,
    )
    .join("\n");
}

function textToEntries(text: string): StatBlockAction[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...description] = line.split(":");

      return description.length
        ? { name: name.trim(), description: description.join(":").trim() }
        : { name: "Imported Entry", description: line };
    });
}

function cleanEntries(entries?: StatBlockAction[]) {
  return (entries ?? []).filter(
    (entry) => entry.name.trim() || entry.description.trim(),
  );
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function labelize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
