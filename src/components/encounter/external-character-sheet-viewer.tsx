"use client";

import { useEffect } from "react";

type ExternalCharacterSheetViewerProps = {
  title: string;
  url: string;
  onClose: () => void;
};

export function ExternalCharacterSheetViewer({
  title,
  url,
  onClose,
}: ExternalCharacterSheetViewerProps) {
  const safeUrl = getSafeExternalSheetUrl(url);
  const displayTitle = title.trim() || getUrlHost(url);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 p-3 backdrop-blur-sm sm:p-6">
      <section className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-cyan-300">
              External Character Sheet
            </p>
            <h3 className="text-lg font-black text-white">{displayTitle}</h3>
          </div>
          <div className="flex gap-2">
            {safeUrl ? (
              <a
                className="rounded-lg border border-cyan-300/45 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:border-cyan-200 hover:text-white"
                href={safeUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open in New Tab
              </a>
            ) : null}
            <button
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 transition hover:border-slate-500 hover:text-white"
              type="button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </header>

        <div className="border-b border-slate-800 bg-amber-300/10 px-3 py-2 text-xs font-semibold leading-5 text-amber-50/90">
          This site may block embedded character sheets. Use Open in New Tab if
          the sheet does not load here.
        </div>

        {safeUrl ? (
          <iframe
            className="min-h-0 flex-1 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            src={safeUrl}
            title={displayTitle}
          />
        ) : (
          <div className="grid flex-1 place-items-center p-6 text-center">
            <div className="max-w-md rounded-xl border border-rose-400/35 bg-rose-500/10 p-5">
              <p className="text-base font-black text-rose-100">
                Character sheet link needs review
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-rose-100/75">
                Only http:// and https:// character sheet URLs can be opened in
                the app.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function getUrlHost(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return "External sheet";
  }
}

export function getSafeExternalSheetUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:"
      ? trimmed
      : "";
  } catch {
    return "";
  }
}
