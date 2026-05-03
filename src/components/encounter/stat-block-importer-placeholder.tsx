export function StatBlockImporterPlaceholder() {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/75 p-4 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">
            Future tool
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">
            Stat Block Importer
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            This placeholder marks the future importer workspace. It is not
            connected to a parser, database, or external source yet.
          </p>
        </div>
        <span className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-amber-100">
          Not wired
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ImporterStep
          label="Paste"
          title="Paste Stat Blocks"
          text="Later, this area can accept original or user-provided stat block text for review."
        />
        <ImporterStep
          label="Review"
          title="Review Parsed Creature"
          text="Parsed fields should be checked and edited before anything becomes a library creature."
        />
        <ImporterStep
          label="Save"
          title="Save To Library"
          text="Approved custom creatures can eventually become reusable Creature Library templates."
        />
        <ImporterStep
          label="Later"
          title="URL Import Support"
          text="Future URL workflows must respect access rules and will not scrape protected or official content."
        />
      </div>
    </section>
  );
}

function ImporterStep({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900/75 p-4">
      <span className="rounded-md bg-cyan-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-200">
        {label}
      </span>
      <h3 className="mt-3 text-base font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </article>
  );
}
