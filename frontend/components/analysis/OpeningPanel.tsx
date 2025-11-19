"use client";

import type { OpeningEntry } from "@/core/chess";
import { useMemo } from "react";
import { Chess } from "chess.js";

type OpeningPanelProps = {
  opening: OpeningEntry | null;
  bookMoves?: string[];
  onPlayBookUci?: (uci: string) => void;
  currentFen?: string;
  bookEnabled?: boolean;
  onToggleBookEnabled?: () => void;
};

export function OpeningPanel({
  opening,
  bookMoves = [],
  onPlayBookUci,
  currentFen,
  bookEnabled = true,
  onToggleBookEnabled,
}: OpeningPanelProps) {
  const sanMoves = useMemo(() => {
    if (!currentFen || bookMoves.length === 0) return [] as { uci: string; san: string }[];
    return bookMoves.map((uci) => {
      try {
        const chess = new Chess(currentFen);
        const promotion = uci.length === 5 ? (uci[4] as any) : undefined;
        const move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion });
        const san = (move && (move as any).san) || uci;
        return { uci, san };
      } catch {
        return { uci, san: uci };
      }
    });
  }, [currentFen, bookMoves]);
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-200">Opening</h3>
        <button
          type="button"
          onClick={onToggleBookEnabled}
          className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
            bookEnabled ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
          }`}
          aria-pressed={bookEnabled}
        >
          Book: {bookEnabled ? "On" : "Off"}
        </button>
      </div>
      {opening ? (
        <div className="space-y-1 text-sm">
          <div className="text-lg font-semibold text-zinc-100">{opening.name}</div>
          <div className="text-zinc-400">ECO: {opening.eco}</div>
          {/* Optional: show main line PGN in small text */}
          {opening.pgn && (
            <div className="mt-2 rounded border border-white/10 bg-zinc-900 p-2 text-xs text-zinc-300">
              {opening.pgn}
            </div>
          )}
          {bookEnabled && sanMoves.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Book moves</div>
              <div className="flex flex-wrap gap-2">
                {sanMoves.map(({ uci, san }) => (
                  <button
                    key={uci}
                    type="button"
                    className="rounded border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
                    onClick={() => onPlayBookUci && onPlayBookUci(uci)}
                  >
                    {san}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-zinc-400">Out of book</div>
      )}
    </div>
  );
}
