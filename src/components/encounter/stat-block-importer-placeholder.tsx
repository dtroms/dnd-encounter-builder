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
import {
  fetchTabyltopCcSrdJson,
  normalizeTabyltopSrdMonster,
  parseSrdMonsterDataset,
  TABYLTOP_CC_SRD_RAW_URL,
  TABYLTOP_SRD_SOURCE,
  tabyltopSrdSampleMonsters,
  type SrdImportDiagnostics,
  type SrdImportPreview,
} from "@/lib/encounter/srd-importer";

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
  existingCreatures = [],
  onSaveCreature,
}: {
  existingCreatures?: LibraryCreature[];
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
  const [srdPreviewLoaded, setSrdPreviewLoaded] = useState(false);
  const [selectedSrdIds, setSelectedSrdIds] = useState<string[]>([]);
  const [activeSrdId, setActiveSrdId] = useState("");
  const [srdImportMessage, setSrdImportMessage] = useState("");
  const [srdJsonInput, setSrdJsonInput] = useState("");
  const [srdDatasetError, setSrdDatasetError] = useState("");
  const [srdDatasetShape, setSrdDatasetShape] = useState("local-sample");
  const [srdDiagnostics, setSrdDiagnostics] =
    useState<SrdImportDiagnostics | null>(null);
  const [srdImporting, setSrdImporting] = useState(false);
  const [srdImportError, setSrdImportError] = useState("");
  const [srdImportStatus, setSrdImportStatus] = useState("");
  const [processedSrdPreviews, setProcessedSrdPreviews] = useState<
    SrdImportPreview[]
  >([]);

  const srdPreviews = useMemo(
    () =>
      processedSrdPreviews.length
        ? processedSrdPreviews
        : tabyltopSrdSampleMonsters.map(normalizeTabyltopSrdMonster),
    [processedSrdPreviews],
  );
  const existingSrdKeys = useMemo(
    () =>
      new Set(
        existingCreatures
          .filter(
            (creature) =>
              creature.sourceType === "srd" &&
              creature.sourceName === TABYLTOP_SRD_SOURCE.sourceName,
          )
          .map(getSrdDuplicateKey),
      ),
    [existingCreatures],
  );
  const activeSrdPreview =
    srdPreviews.find((preview) => preview.creature.id === activeSrdId) ??
    srdPreviews[0];

  const missingFields = useMemo(() => {
    if (!draft) {
      return [];
    }

    return [
      !draft.name.trim() ? "name" : null,
      !isValidPositiveNumber(draft.armorClass) ? "armor class" : null,
      !isValidPositiveNumber(draft.maxHp) ? "hit points" : null,
      !draft.speed.trim() ? "speed" : null,
      !draft.challengeRating?.trim() ? "challenge rating" : null,
      !draft.monsterType || draft.monsterType === "Unknown / Unset"
        ? "creature type"
        : null,
      !hasValidAbilityScores(draft.abilityScores) ? "ability scores" : null,
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
      armorClass: cleanNumber(draft.armorClass, 10),
      bonusActions: cleanEntries(draft.bonusActions),
      conditionImmunities: cleanTextList(draft.conditionImmunities),
      damageImmunities: cleanTextList(draft.damageImmunities),
      damageResistances: cleanTextList(draft.damageResistances),
      damageVulnerabilities: cleanTextList(draft.damageVulnerabilities),
      initiativeBonus: cleanNumber(draft.initiativeBonus, 0),
      lairActions: cleanEntries(draft.lairActions),
      legendaryActions: cleanEntries(draft.legendaryActions),
      maxHp: cleanNumber(draft.maxHp, 1),
      notes: draft.notes?.trim(),
      reactions: cleanEntries(draft.reactions),
      savingThrows: cleanTextList(draft.savingThrows),
      skills: cleanTextList(draft.skills),
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

  function loadSrdPreview() {
    const previews = srdPreviews;
    setSrdPreviewLoaded(true);
    setSrdDiagnostics({
      candidateCollections: [
        {
          monsterLikeCount: previews.length,
          path: "local-sample",
          recordCount: previews.length,
          sampleKeys: previews
            .slice(0, 3)
            .map((preview) => Object.keys(preview.raw).slice(0, 20)),
          score: previews.length,
        },
      ],
      chosenPath: "local-sample",
      rootType: "array",
      sampleRecordKeys: previews
        .slice(0, 3)
        .map((preview) => Object.keys(preview.raw).slice(0, 20)),
      topLevelKeys: [],
      totalCandidateRecords: previews.length,
    });
    const importableIds = srdPreviews
      .filter(
        (preview) =>
          preview.status === "ready" &&
          !existingSrdKeys.has(getSrdDuplicateKey(preview.creature)),
      )
      .map((preview) => preview.creature.id);
    setSelectedSrdIds(importableIds);
    setActiveSrdId(srdPreviews[0]?.creature.id ?? "");
    setSrdImportMessage("");
    setSrdImportError("");
    setSrdImportStatus("");
  }

  function processSrdJsonInput() {
    const result = parseSrdMonsterDataset(srdJsonInput);

    if (result.error) {
      setSrdDatasetError(result.error);
      setProcessedSrdPreviews([]);
      setSrdPreviewLoaded(false);
      setSrdDiagnostics(result.diagnostics);
      setSelectedSrdIds([]);
      setSrdImportMessage("");
      setSrdImportStatus("");
      return;
    }

    const previews = result.records.map(normalizeTabyltopSrdMonster);
    setProcessedSrdPreviews(previews);
    setSrdDiagnostics(result.diagnostics);
    setSrdDatasetShape(result.shape);
    setSrdDatasetError("");
    setSrdImportError("");
    setSrdImportStatus("");
    setSrdPreviewLoaded(true);
    setSelectedSrdIds(
      previews
        .filter(
          (preview) =>
            preview.status === "ready" &&
            !existingSrdKeys.has(getSrdDuplicateKey(preview.creature)),
        )
        .map((preview) => preview.creature.id),
    );
    setActiveSrdId(previews[0]?.creature.id ?? "");
    setSrdImportMessage(
      `Processed ${previews.length} SRD record${previews.length === 1 ? "" : "s"} from ${result.shape}.`,
    );
  }

  function toggleSrdSelection(creatureId: string) {
    setSelectedSrdIds((current) =>
      current.includes(creatureId)
        ? current.filter((id) => id !== creatureId)
        : [...current, creatureId],
    );
  }

  function importSelectedSrdCreatures() {
    if (!onSaveCreature) {
      return;
    }

    const importedKeys = new Set(existingSrdKeys);
    const selectedPreviews = srdPreviews.filter((preview) =>
      selectedSrdIds.includes(preview.creature.id),
    );
    const importablePreviews = selectedPreviews.filter((preview) => {
      const duplicateKey = getSrdDuplicateKey(preview.creature);
      const canImport =
        preview.status === "ready" && !importedKeys.has(duplicateKey);
      if (canImport) {
        importedKeys.add(duplicateKey);
      }

      return canImport;
    });
    const importedAt = new Date().toISOString();

    importablePreviews.forEach((preview, index) => {
      onSaveCreature({
        ...preview.creature,
        id: `${preview.creature.id}-${Date.now()}-${index}`,
        importedAt,
        notes: `${preview.creature.notes}\nImported locally at ${importedAt}.`,
      });
    });

    setSelectedSrdIds([]);
    setSrdImportMessage(
      buildSrdImportReport(
        srdPreviews,
        importablePreviews.length,
        existingSrdKeys,
        "manual preview / pasted JSON",
      ),
    );
  }

  async function importAllSrdMonsters() {
    if (!onSaveCreature || srdImporting) {
      return;
    }

    setSrdImporting(true);
    setSrdImportError("");
    setSrdImportMessage("");
    setSrdImportStatus("Fetching Tabyltop CC-SRD data from GitHub...");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 45000);

    try {
      const fetched = await fetchTabyltopCcSrdJson({
        signal: controller.signal,
      });
      setSrdImportStatus(
        `Fetched ${formatBytes(fetched.byteLength)} from GitHub. Processing SRD monster records...`,
      );
      await yieldToBrowser();

      const result = parseSrdMonsterDataset(fetched.jsonText);

      if (result.error) {
        throw new Error(
          `${result.error} You can try again later or paste SRD JSON into the fallback box below.`,
        );
      }

      setSrdDiagnostics(result.diagnostics);

      const previews = await normalizeSrdPreviews(result.records, (processed) => {
        setSrdImportStatus(
          `Processing SRD monster records... ${processed} of ${result.records.length}`,
        );
      });
      const importedKeys = new Set(existingSrdKeys);
      const importablePreviews = previews.filter((preview) => {
        const duplicateKey = getSrdDuplicateKey(preview.creature);
        const canImport =
          preview.status === "ready" && !importedKeys.has(duplicateKey);
        if (canImport) {
          importedKeys.add(duplicateKey);
        }

        return canImport;
      });
      const importedAt = new Date().toISOString();

      importablePreviews.forEach((preview, index) => {
        onSaveCreature({
          ...preview.creature,
          id: `${preview.creature.id}-${Date.now()}-${index}`,
          importMethod: "automated-srd-json",
          importedAt,
          notes: `${preview.creature.notes}\nImported locally at ${importedAt}.`,
        });
      });

      setProcessedSrdPreviews(previews);
      setSrdDiagnostics(result.diagnostics);
      setSrdDatasetShape(result.shape);
      setSrdPreviewLoaded(true);
      setSelectedSrdIds([]);
      setActiveSrdId(previews[0]?.creature.id ?? "");
      setSrdImportMessage(
        buildSrdImportReport(
          previews,
          importablePreviews.length,
          existingSrdKeys,
          "GitHub raw JSON",
        ),
      );
      setSrdImportStatus(
        `Finished processing ${previews.length} extracted monster record${previews.length === 1 ? "" : "s"}.`,
      );
    } catch (error) {
      setSrdImportError(
        error instanceof DOMException && error.name === "AbortError"
          ? "The GitHub SRD fetch timed out. Try again later or paste SRD JSON into the fallback box below."
          : error instanceof Error
          ? error.message
          : "The GitHub SRD import could not be processed. Try again later or use Paste SRD JSON.",
      );
      setSrdImportStatus("");
    } finally {
      window.clearTimeout(timeoutId);
      setSrdImporting(false);
    }
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
          activePreview={activeSrdPreview}
          existingSrdKeys={existingSrdKeys}
          importMessage={srdImportMessage}
          jsonInput={srdJsonInput}
          previewLoaded={srdPreviewLoaded}
          previews={srdPreviews}
          processingError={srdDatasetError}
          sourceShape={srdDatasetShape}
          importError={srdImportError}
          importing={srdImporting}
          importStatus={srdImportStatus}
          diagnostics={srdDiagnostics}
          selectedIds={selectedSrdIds}
          onImportAll={importAllSrdMonsters}
          onImportSelected={importSelectedSrdCreatures}
          onLoadPreview={loadSrdPreview}
          onProcessJson={processSrdJsonInput}
          onSelectPreview={setActiveSrdId}
          onJsonInputChange={setSrdJsonInput}
          onToggleSelection={toggleSrdSelection}
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
  const lowConfidenceFields = parseResult?.lowConfidenceFields ?? [];

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

      {warnings.length || missingFields.length || lowConfidenceFields.length ? (
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
            {lowConfidenceFields.length ? (
              <li>Needs review: {lowConfidenceFields.join(", ")}.</li>
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

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextInput
          label="Armor Note"
          value={draft.armorClassNote ?? ""}
          onChange={(armorClassNote) => onPatchDraft({ armorClassNote })}
        />
        <TextInput
          label="HP Formula"
          value={draft.hitPointFormula ?? ""}
          onChange={(hitPointFormula) => onPatchDraft({ hitPointFormula })}
        />
        <TextInput
          label="Alignment"
          value={draft.alignment ?? ""}
          onChange={(alignment) => onPatchDraft({ alignment })}
        />
        <TextInput
          label="Subtype"
          value={draft.monsterSubtype ?? ""}
          onChange={(monsterSubtype) => onPatchDraft({ monsterSubtype })}
        />
        <TextInput
          label="Saving Throws"
          value={(draft.savingThrows ?? []).join(", ")}
          onChange={(value) => onPatchDraft({ savingThrows: splitTags(value) })}
        />
        <TextInput
          label="Skills"
          value={(draft.skills ?? []).join(", ")}
          onChange={(value) => onPatchDraft({ skills: splitTags(value) })}
        />
        <TextInput
          label="Damage Vulnerabilities"
          value={(draft.damageVulnerabilities ?? []).join(", ")}
          onChange={(value) =>
            onPatchDraft({ damageVulnerabilities: splitTags(value) })
          }
        />
        <TextInput
          label="Damage Resistances"
          value={(draft.damageResistances ?? []).join(", ")}
          onChange={(value) =>
            onPatchDraft({ damageResistances: splitTags(value) })
          }
        />
        <TextInput
          label="Damage Immunities"
          value={(draft.damageImmunities ?? []).join(", ")}
          onChange={(value) =>
            onPatchDraft({ damageImmunities: splitTags(value) })
          }
        />
        <TextInput
          label="Condition Immunities"
          value={(draft.conditionImmunities ?? []).join(", ")}
          onChange={(value) =>
            onPatchDraft({ conditionImmunities: splitTags(value) })
          }
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
          {parseResult?.normalizedRawText ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-cyan-200">
                Normalized Raw Text
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs leading-5 text-slate-400">
                {parseResult.normalizedRawText}
              </pre>
            </details>
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
  activePreview,
  existingSrdKeys,
  importError,
  importing,
  importMessage,
  importStatus,
  diagnostics,
  jsonInput,
  previewLoaded,
  previews,
  processingError,
  selectedIds,
  sourceShape,
  onImportAll,
  onImportSelected,
  onLoadPreview,
  onJsonInputChange,
  onProcessJson,
  onSelectPreview,
  onToggleSelection,
}: {
  activePreview?: SrdImportPreview;
  existingSrdKeys: Set<string>;
  importError: string;
  importing: boolean;
  importMessage: string;
  importStatus: string;
  diagnostics: SrdImportDiagnostics | null;
  jsonInput: string;
  previewLoaded: boolean;
  previews: SrdImportPreview[];
  processingError: string;
  selectedIds: string[];
  sourceShape: string;
  onImportAll: () => void;
  onImportSelected: () => void;
  onLoadPreview: () => void;
  onJsonInputChange: (value: string) => void;
  onProcessJson: () => void;
  onSelectPreview: (creatureId: string) => void;
  onToggleSelection: (creatureId: string) => void;
}) {
  const selectedCount = selectedIds.length;
  const readyCount = previews.filter(
    (preview) =>
      preview.status === "ready" &&
      !existingSrdKeys.has(getSrdDuplicateKey(preview.creature)),
  ).length;
  const errorCount = previews.filter((preview) => preview.status === "error").length;
  const needsReviewCount = previews.filter(
    (preview) => preview.status === "needs-review",
  ).length;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
      <StepLabel step="1" text="SRD Source / Preview" />
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
            <SourceFact label="Raw JSON" value="SRD5.1-CCBY4.0License-TT.json" />
            <SourceFact label="Document" value={TABYLTOP_SRD_SOURCE.sourceDocumentVersion} />
            <SourceFact label="License" value={TABYLTOP_SRD_SOURCE.licenseName} />
            <SourceFact label="Source Type" value="srd" />
          </dl>
          <p className="mt-4 rounded-lg border border-emerald-300/20 bg-slate-950/45 p-3 text-sm leading-6 text-emerald-50/90">
            Imports Creative Commons SRD content only. Review normalized records
            before adding them to your library. Non-SRD official monsters are
            not bundled.
          </p>
          <div className="mt-4 rounded-xl border border-emerald-300/30 bg-slate-950/55 p-3">
            <p className="text-sm font-black text-white">
              One-click local SRD import
            </p>
            <p className="mt-1 text-sm leading-6 text-emerald-50/85">
              Fetches the Creative Commons SRD data from GitHub and imports
              only records that pass validation. Invalid, needs-review, and
              duplicate records are skipped.
            </p>
            <p className="mt-2 break-all text-xs font-semibold text-emerald-100/80">
              {TABYLTOP_CC_SRD_RAW_URL}
            </p>
            <button
              className="mt-3 rounded-lg border border-emerald-200 bg-emerald-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
              disabled={importing}
              type="button"
              onClick={onImportAll}
            >
              {importing ? "Importing SRD monsters..." : "Import All SRD Monsters"}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-emerald-300/50 bg-emerald-300 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-200"
              type="button"
              onClick={onLoadPreview}
            >
              Load Local Preview
            </button>
            <button
              className="rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:border-cyan-200 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
              disabled={!selectedCount}
              type="button"
              onClick={onImportSelected}
            >
              Import All Valid ({selectedCount})
            </button>
          </div>
          {importError ? (
            <p className="mt-3 rounded-lg border border-red-300/25 bg-red-400/10 p-3 text-sm font-bold text-red-100">
              {importError}
            </p>
          ) : null}
          {importStatus ? (
            <p className="mt-3 rounded-lg border border-cyan-300/25 bg-cyan-300/10 p-3 text-sm font-bold text-cyan-100">
              {importStatus}
            </p>
          ) : null}
          {importMessage ? (
            <p className="mt-3 text-sm font-bold text-emerald-100">
              {importMessage}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/55 p-4">
          <h3 className="text-lg font-black text-white">
            Planned Adapter Workflow
          </h3>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            <li>1. Fetch the direct raw CC-SRD JSON file from GitHub on click.</li>
            <li>2. Normalize records into the app creature template shape.</li>
            <li>3. Validate AC, HP, initiative bonus, CR, actions, license, and attribution.</li>
            <li>4. Generate an import preview with warnings and missing fields.</li>
            <li>5. Import Ready records only; skip duplicates and records that need review.</li>
          </ol>
          <p className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50/90">
            The fetch is user-triggered and uses only the raw JSON URL. If
            GitHub is unavailable, use the pasted JSON fallback below. No
            database write is performed.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/55 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Full Dataset Test Input
            </p>
            <h3 className="mt-1 text-lg font-black text-white">
              Paste Tabyltop-Style Monster JSON
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Supports arrays, <code>{"{ monsters: [...] }"}</code>,{" "}
              <code>{"{ data: [...] }"}</code>,{" "}
              <code>{"{ results: [...] }"}</code>, and keyed monster objects.
              Processing happens only when you click Process Import.
            </p>
          </div>
          <button
            className="rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:border-cyan-200 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
            disabled={!jsonInput.trim()}
            type="button"
            onClick={onProcessJson}
          >
            Process Import
          </button>
        </div>
        <textarea
          className="mt-3 min-h-36 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
          placeholder={'[{ "name": "Example", "meta": "Medium beast, unaligned", "armor_class": "Armor Class 12", "hit_points": "Hit Points 7 (2d6)", "speed": "Speed 30 ft.", "challenge": "Challenge 1/8 (25 XP)", "stats": [10, 12, 10, 3, 10, 6], "actions": [{ "name": "Bite", "desc": "Melee Weapon Attack..." }] }]'}
          value={jsonInput}
          onChange={(event) => onJsonInputChange(event.target.value)}
        />
        {processingError ? (
          <p className="mt-3 rounded-lg border border-red-300/25 bg-red-400/10 p-3 text-sm font-bold text-red-100">
            {processingError}
          </p>
        ) : null}
      </div>

      {previewLoaded ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.85fr]">
          <div className="rounded-xl border border-slate-800 bg-slate-900/55 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                SRD Import Preview
              </p>
              <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                {previews.length} records normalized from {sourceShape}
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <PreviewStat label="Ready" value={String(readyCount)} />
              <PreviewStat label="Needs Review" value={String(needsReviewCount)} />
              <PreviewStat label="Errors" value={String(errorCount)} />
            </div>
            <div className="mt-3 space-y-2">
              {previews.map((preview) => {
                const duplicate = existingSrdKeys.has(
                  getSrdDuplicateKey(preview.creature),
                );
                const disabled = duplicate || preview.status !== "ready";

                return (
                  <button
                    key={preview.creature.id}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      activePreview?.creature.id === preview.creature.id
                        ? "border-emerald-300/60 bg-emerald-300/10"
                        : "border-slate-800 bg-slate-950/65 hover:border-slate-600"
                    }`}
                    type="button"
                    onClick={() => onSelectPreview(preview.creature.id)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <label
                        className="flex min-w-0 flex-1 items-start gap-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          checked={selectedIds.includes(preview.creature.id)}
                          className="mt-1"
                          disabled={disabled}
                          type="checkbox"
                          onChange={() => onToggleSelection(preview.creature.id)}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-base font-black text-white">
                            {preview.creature.name || "Unnamed SRD Creature"}
                          </span>
                          <span className="mt-1 block text-xs font-bold text-slate-400">
                            {preview.creature.size} {preview.creature.monsterType} - CR{" "}
                            {preview.creature.challengeRating || "Needs review"} - AC{" "}
                            {preview.creature.armorClass} - HP {preview.creature.maxHp}
                          </span>
                        </span>
                      </label>
                      <StatusPill
                        duplicate={duplicate}
                        status={preview.status}
                        warnings={preview.warnings.length}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <SrdReviewPanel preview={activePreview} />
        </div>
      ) : null}

      {previewLoaded ? (
        <SrdBatchReport previews={previews} existingSrdKeys={existingSrdKeys} />
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/45 p-6 text-center">
          <h3 className="text-lg font-black text-white">
            Load a Local SRD Preview
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            This will normalize a small local Tabyltop-shaped sample subset so
            you can review validation status and import selected records into
            the local Library session.
          </p>
        </div>
      )}

      <SrdDiagnosticsPanel diagnostics={diagnostics} previews={previews} />
    </section>
  );
}

function SrdDiagnosticsPanel({
  diagnostics,
  previews,
}: {
  diagnostics: SrdImportDiagnostics | null;
  previews: SrdImportPreview[];
}) {
  if (!diagnostics) {
    return null;
  }

  const errorReasons = summarizeSrdErrorReasons(previews);
  const failedSamples = previews
    .filter((preview) => preview.status === "error")
    .slice(0, 5);

  return (
    <details className="mt-4 rounded-xl border border-slate-800 bg-slate-900/55 p-4">
      <summary className="cursor-pointer text-base font-black text-white">
        Import Diagnostics
      </summary>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            JSON Shape
          </p>
          <dl className="mt-2 space-y-2 text-sm text-slate-300">
            <DiagnosticFact label="Root" value={diagnostics.rootType} />
            <DiagnosticFact
              label="Chosen Path"
              value={diagnostics.chosenPath ?? "None"}
            />
            <DiagnosticFact
              label="Candidate Records"
              value={String(diagnostics.totalCandidateRecords)}
            />
            <DiagnosticFact
              label="Top-Level Keys"
              value={
                diagnostics.topLevelKeys.length
                  ? diagnostics.topLevelKeys.join(", ")
                  : "None / root array"
              }
            />
          </dl>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            Candidate Monster Collections
          </p>
          {diagnostics.candidateCollections.length ? (
            <div className="mt-2 space-y-2">
              {diagnostics.candidateCollections.slice(0, 6).map((item) => (
                <div
                  className="rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-sm"
                  key={`${item.path}-${item.recordCount}-${item.score}`}
                >
                  <p className="font-black text-slate-100">{item.path}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {item.monsterLikeCount} monster-like / {item.recordCount} records
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-400">
              No structured monster-like arrays found.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
          Sample Record Keys
        </p>
        <div className="mt-2 space-y-2">
          {diagnostics.sampleRecordKeys.length ? (
            diagnostics.sampleRecordKeys.map((keys, index) => (
              <p
                className="rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-xs font-semibold text-slate-300"
                key={`${index}-${keys.join("-")}`}
              >
                {keys.join(", ")}
              </p>
            ))
          ) : (
            <p className="text-sm font-semibold text-slate-400">
              No sample monster keys available.
            </p>
          )}
        </div>
      </div>

      {errorReasons.length || failedSamples.length ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-red-300/20 bg-red-400/10 p-3">
            <p className="text-xs font-black uppercase tracking-wide text-red-100">
              Top Error Reasons
            </p>
            {errorReasons.length ? (
              <ul className="mt-2 space-y-1 text-sm font-semibold text-red-50/90">
                {errorReasons.map((item) => (
                  <li key={item.reason}>
                    {item.reason}: {item.count}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm font-semibold text-red-50/80">
                No error records in the current preview.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Sample Failed Records
            </p>
            {failedSamples.length ? (
              <div className="mt-2 space-y-2">
                {failedSamples.map((preview) => (
                  <div
                    className="rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-sm"
                    key={preview.creature.id}
                  >
                    <p className="font-black text-white">
                      {preview.creature.name || "Unnamed record"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Keys: {Object.keys(preview.raw).slice(0, 12).join(", ")}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-red-100">
                      {preview.missingRequiredFields.join(", ") ||
                        preview.warnings.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm font-semibold text-slate-400">
                No failed records to sample.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </details>
  );
}

function SrdBatchReport({
  existingSrdKeys,
  previews,
}: {
  existingSrdKeys: Set<string>;
  previews: SrdImportPreview[];
}) {
  const skippedDuplicates = getDuplicateSrdPreviews(previews, existingSrdKeys);
  const errors = previews.filter((preview) => preview.status === "error");
  const needsReview = previews.filter(
    (preview) => preview.status === "needs-review",
  );
  const reportItems = [
    ...errors.map((preview) => ({
      name: preview.creature.name || "Unnamed record",
      reason:
        preview.missingRequiredFields.join(", ") ||
        preview.warnings.join(", ") ||
        "Validation error",
      status: "Error",
    })),
    ...needsReview.map((preview) => ({
      name: preview.creature.name || "Unnamed record",
      reason: preview.warnings.join(", ") || "Needs review",
      status: "Needs Review",
    })),
    ...skippedDuplicates.map((preview) => ({
      name: preview.creature.name,
      reason: "Already exists in the local Library.",
      status: "Duplicate",
    })),
  ].slice(0, 12);

  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/55 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-black text-white">
          Skipped / Review Report
        </h3>
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
          Showing first {reportItems.length} issue{reportItems.length === 1 ? "" : "s"}
        </span>
      </div>
      {reportItems.length ? (
        <div className="mt-3 space-y-2">
          {reportItems.map((item) => (
            <div
              key={`${item.status}-${item.name}-${item.reason}`}
              className="rounded-lg border border-slate-800 bg-slate-950/70 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-black text-white">{item.name}</p>
                <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">
                  {item.status}
                </span>
              </div>
              <p className="mt-1 text-sm leading-5 text-slate-400">
                {item.reason}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm font-semibold text-slate-400">
          No skipped errors, review records, or duplicates in the current
          processed set.
        </p>
      )}
    </div>
  );
}

function StatusPill({
  duplicate,
  status,
  warnings,
}: {
  duplicate: boolean;
  status: SrdImportPreview["status"];
  warnings: number;
}) {
  if (duplicate) {
    return (
      <span className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">
        Already in library
      </span>
    );
  }

  const styles: Record<SrdImportPreview["status"], string> = {
    error: "border-red-300/35 bg-red-400/10 text-red-100",
    "needs-review": "border-amber-300/35 bg-amber-300/10 text-amber-100",
    ready: "border-emerald-300/35 bg-emerald-300/10 text-emerald-100",
  };

  return (
    <span
      className={`rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${styles[status]}`}
    >
      {status === "needs-review" ? `${warnings} warnings` : status}
    </span>
  );
}

function SrdReviewPanel({ preview }: { preview?: SrdImportPreview }) {
  if (!preview) {
    return null;
  }

  const creature = preview.creature;
  const validationNotes = buildSrdValidationNotes(preview);
  const abilityPreviewStats = [
    ["STR", creature.abilityScores.str],
    ["DEX", creature.abilityScores.dex],
    ["CON", creature.abilityScores.con],
    ["INT", creature.abilityScores.int],
    ["WIS", creature.abilityScores.wis],
    ["CHA", creature.abilityScores.cha],
  ] as const;

  return (
    <aside className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        Selected SRD Review
      </p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-white">{creature.name}</h3>
          <p className="mt-1 text-sm font-bold text-slate-400">
            {creature.size} {creature.monsterType}
            {creature.alignment ? `, ${creature.alignment}` : ""} - CR{" "}
            {creature.challengeRating || "Needs review"}
          </p>
        </div>
        <StatusPill
          duplicate={false}
          status={preview.status}
          warnings={preview.warnings.length}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <PreviewStat label="AC" value={String(creature.armorClass)} />
        <PreviewStat label="HP" value={String(creature.maxHp)} />
        <PreviewStat label="Init" value={signed(creature.initiativeBonus)} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {abilityPreviewStats.map(([label, value]) => (
          <PreviewStat
            key={label}
            label={label}
            value={
              preview.abilityScoreDiagnostics.detected
                ? String(value)
                : "Needs review"
            }
          />
        ))}
      </div>

      <details className="mt-3 rounded-xl border border-slate-800 bg-slate-900/45 p-3">
        <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-slate-500">
          Ability Import Diagnostic
        </summary>
        <div className="mt-2 space-y-1 text-sm leading-5 text-slate-400">
          <p>
            Source:{" "}
            <span className="font-bold text-slate-200">
              {preview.abilityScoreDiagnostics.source}
            </span>
          </p>
          <p>
            Parsed:{" "}
            <span className="font-bold text-slate-200">
              {preview.abilityScoreDiagnostics.summary}
            </span>
          </p>
        </div>
      </details>

      {validationNotes.length ? (
        <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-amber-100">
            Validation Notes
          </p>
          <ul className="mt-2 space-y-1 text-sm leading-5 text-amber-50/90">
            {validationNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/45 p-3">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
          Source / License
        </p>
        <p className="mt-2 text-sm font-bold text-slate-300">
          {creature.sourceName} - {creature.licenseName}
        </p>
        <p className="mt-1 break-all text-xs font-semibold text-slate-500">
          {creature.sourceUrl}
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        <PreviewEntries title="Traits" entries={creature.traits} />
        <PreviewEntries title="Actions" entries={creature.actions} />
        {creature.legendaryActions?.length ? (
          <PreviewEntries
            title="Legendary Actions"
            entries={creature.legendaryActions}
          />
        ) : null}
      </div>
    </aside>
  );
}

function buildSrdValidationNotes(preview: SrdImportPreview) {
  const notes = [
    preview.missingRequiredFields.length
      ? `${
          preview.missingRequiredFields.length === 1
            ? "Missing required field"
            : "Missing required fields"
        }: ${preview.missingRequiredFields.join(", ")}.`
      : "",
    ...preview.warnings,
  ].filter(Boolean);
  const seen = new Set<string>();

  return notes.filter((note) => {
    const key = normalizeValidationNote(note);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeValidationNote(value: string) {
  return value
    .toLowerCase()
    .replace(/missing required fields?:/g, "")
    .replace(/\.+$/g, "")
    .trim();
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/55 p-3 text-center">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function PreviewEntries({
  entries,
  title,
}: {
  entries: StatBlockAction[];
  title: string;
}) {
  return (
    <div>
      <h4 className="text-sm font-black text-white">{title}</h4>
      <div className="mt-2 space-y-2">
        {entries.slice(0, 3).map((entry) => (
          <div key={`${title}-${entry.name}`} className="text-sm leading-6">
            <span className="font-black text-slate-200">{entry.name}. </span>
            <span className="text-slate-400">{entry.description}</span>
          </div>
        ))}
      </div>
      {entries.length > 3 ? (
        <p className="mt-2 text-xs font-bold text-slate-500">
          + {entries.length - 3} more
        </p>
      ) : null}
    </div>
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

function DiagnosticFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <dt className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="max-w-full break-words text-right text-sm font-bold text-slate-200">
        {value}
      </dd>
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
  const safeValue = Number.isFinite(value) ? value : "";

  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        className="mt-1 h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-300"
        type="number"
        value={safeValue}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          onChange(Number.isFinite(parsed) ? parsed : 0);
        }}
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
    alignment: draft.alignment,
    armorClass: draft.armorClass ?? 10,
    armorClassNote: draft.armorClassNote,
    attribution: undefined,
    autoRollEligible: draft.type !== "pc",
    bonusActions: draft.bonusActions,
    challengeRating: draft.challengeRating || "0",
    challengeXp: draft.challengeXp,
    conditionImmunities: draft.conditionImmunities,
    damageImmunities: draft.damageImmunities,
    damageResistances: draft.damageResistances,
    damageVulnerabilities: draft.damageVulnerabilities,
    abilityScores: draft.abilityScores,
    hitPointFormula: draft.hitPointFormula,
    id: `import-draft-${Date.now()}`,
    importMethod: "paste",
    initiativeBonus: draft.initiativeBonus ?? 0,
    lairActions: draft.lairActions,
    languages: draft.languages || "None",
    legendaryActions: draft.legendaryActions,
    licenseName: "user-provided/private",
    maxHp: draft.maxHp ?? 1,
    monsterSubtype: draft.monsterSubtype,
    monsterType: draft.monsterType,
    name: draft.name,
    normalizedRawImportText: draft.normalizedRawText,
    notes: rawText
      ? `${draft.notes}\n\nRaw pasted text is held only in this local review draft.`
      : draft.notes,
    rawImportText: draft.rawImportText,
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

function cleanNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function cleanTextList(values?: string[]) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function buildSrdImportReport(
  previews: SrdImportPreview[],
  importedCount: number,
  existingSrdKeys: Set<string>,
  sourceLabel: string,
) {
  const duplicateCount = getDuplicateSrdPreviews(previews, existingSrdKeys).length;
  const errorCount = previews.filter((preview) => preview.status === "error").length;
  const needsReviewCount = previews.filter(
    (preview) => preview.status === "needs-review",
  ).length;

  return [
    `SRD Import Complete: ${previews.length} record${previews.length === 1 ? "" : "s"} processed.`,
    `Source: ${TABYLTOP_SRD_SOURCE.sourceName} ${sourceLabel}.`,
    `${importedCount} Ready SRD creature${importedCount === 1 ? "" : "s"} imported.`,
    `${duplicateCount} duplicate${duplicateCount === 1 ? "" : "s"} skipped.`,
    `${errorCount} error record${errorCount === 1 ? "" : "s"} skipped.`,
    `${needsReviewCount} needs-review record${needsReviewCount === 1 ? "" : "s"} skipped.`,
  ].join(" ");
}

function summarizeSrdErrorReasons(previews: SrdImportPreview[]) {
  const counts = new Map<string, number>();

  previews
    .filter((preview) => preview.status === "error")
    .forEach((preview) => {
      const reasons = preview.missingRequiredFields.length
        ? preview.missingRequiredFields
        : preview.warnings.length
          ? preview.warnings
          : ["Unknown validation error"];

      reasons.forEach((reason) => {
        counts.set(reason, (counts.get(reason) ?? 0) + 1);
      });
    });

  return [...counts.entries()]
    .map(([reason, count]) => ({ count, reason }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

async function normalizeSrdPreviews(
  records: Array<Record<string, unknown>>,
  onProgress: (processed: number) => void,
) {
  const previews: SrdImportPreview[] = [];

  for (let index = 0; index < records.length; index += 1) {
    previews.push(normalizeTabyltopSrdMonster(records[index]));

    if ((index + 1) % 50 === 0) {
      onProgress(index + 1);
      await yieldToBrowser();
    }
  }

  onProgress(records.length);

  return previews;
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} bytes`;
  }

  const kb = value / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

function getDuplicateSrdPreviews(
  previews: SrdImportPreview[],
  existingSrdKeys: Set<string>,
) {
  const seenKeys = new Set(existingSrdKeys);

  return previews.filter((preview) => {
    const duplicateKey = getSrdDuplicateKey(preview.creature);
    const duplicate = seenKeys.has(duplicateKey);
    seenKeys.add(duplicateKey);

    return duplicate;
  });
}

function getSrdDuplicateKey(
  creature: Pick<
    LibraryCreature,
    "name" | "sourceDocumentVersion" | "sourceName" | "sourceType"
  >,
) {
  return [
    creature.sourceType,
    creature.sourceName,
    creature.sourceDocumentVersion ?? TABYLTOP_SRD_SOURCE.sourceDocumentVersion,
    creature.name.trim().toLowerCase(),
  ].join("::");
}

function hasValidAbilityScores(scores: AbilityScores) {
  return Object.values(scores).every((score) => Number.isFinite(score) && score > 0);
}

function isValidPositiveNumber(value: number) {
  return Number.isFinite(value) && value > 0;
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

function signed(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
