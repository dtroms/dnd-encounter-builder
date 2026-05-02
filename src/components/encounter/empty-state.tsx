export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
      <p className="text-lg font-black text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        {detail}
      </p>
    </div>
  );
}
