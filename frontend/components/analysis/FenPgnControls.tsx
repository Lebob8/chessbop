"use client";

type FenPgnControlsProps = {
  currentFen: string;
  fenInput: string | null;
  onFenInputChange: (value: string) => void;
  onFenClear: () => void;
  fenError: string | null;
  onLoadFen: () => void;
  pgnExport: string;
  pgnInput: string;
  onPgnInputChange: (value: string) => void;
  onPgnClear: () => void;
  pgnError: string | null;
  onLoadPgn: () => void;
};

/**
 * FEN / PGN import/export controls:
 * - shows the current position FEN/PGN
 * - lets the user load new FEN/PGN into the analysis tree.
 * All state changes are delegated to callbacks from parent.
 */
export function FenPgnControls({
  currentFen,
  fenInput,
  onFenInputChange,
  onFenClear,
  fenError,
  onLoadFen,
  pgnExport,
  pgnInput,
  onPgnInputChange,
  onPgnClear,
  pgnError,
  onLoadPgn,
}: FenPgnControlsProps) {
  return (
    <>
      {/* FEN import/export */}
      <div className="mt-3 space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-400">Current FEN</span>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(currentFen);
              }}
              className="rounded border border-white/10 bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-200 hover:bg-zinc-700"
            >
              Copy
            </button>
          </div>
          <textarea
            className="w-full resize-none rounded border border-white/10 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300"
            rows={2}
            value={currentFen}
            readOnly
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-400">Load FEN</span>
            <button
              type="button"
              onClick={onFenClear}
              className="rounded border border-white/10 bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-200 hover:bg-zinc-700"
            >
              Clear
            </button>
          </div>
          <textarea
            className="w-full resize-none rounded border border-white/10 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300"
            rows={2}
            value={fenInput ?? currentFen}
            onChange={(e) => onFenInputChange(e.target.value)}
            placeholder="Paste FEN here and click Load"
          />
          {fenError && (
            <div className="text-[11px] text-red-400">{fenError}</div>
          )}
          <button
            type="button"
            onClick={onLoadFen}
            className="rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
          >
            Load FEN into analysis
          </button>
        </div>
      </div>

      {/* PGN import/export */}
      <div className="mt-4 space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-400">Current PGN (main line)</span>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(pgnExport);
              }}
              className="rounded border border-white/10 bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-200 hover:bg-zinc-700"
            >
              Copy
            </button>
          </div>
          <textarea
            className="w-full resize-none rounded border border-white/10 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300"
            rows={4}
            value={pgnExport}
            readOnly
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-400">Load PGN</span>
            <button
              type="button"
              onClick={onPgnClear}
              className="rounded border border-white/10 bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-200 hover:bg-zinc-700"
            >
              Clear
            </button>
          </div>
          <textarea
            className="w-full resize-none rounded border border-white/10 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300"
            rows={4}
            value={pgnInput}
            onChange={(e) => onPgnInputChange(e.target.value)}
            placeholder="Paste PGN here and click Load"
          />
          {pgnError && (
            <div className="text-[11px] text-red-400">{pgnError}</div>
          )}
          <button
            type="button"
            onClick={onLoadPgn}
            className="rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
          >
            Load PGN into analysis
          </button>
        </div>
      </div>
    </>
  );
}

