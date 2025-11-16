"use client";

import { useState } from "react";
import ChessBoard from "@/components/ChessBoard";

export default function AnalysisView() {
  const [boardKey, setBoardKey] = useState(0);

  const resetBoard = () => setBoardKey((k) => k + 1);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,700px)_minmax(260px,1fr)] lg:grid-cols-[minmax(0,800px)_minmax(320px,1fr)]">
      {/* Board area */}
      <section className="flex flex-col items-center gap-4">
        <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-3">
          {/* Fixed size for now; will be made responsive later */}
          <ChessBoard key={boardKey} />
        </div>
      </section>

      {/* Sidebar */}
      <aside className="flex min-h-[500px] flex-col gap-4">
      <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-zinc-200">Engine</h3>
          <div className="text-sm text-zinc-400">(engine)</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-zinc-200">Move List</h3>
          <div className="h-72 overflow-auto text-sm text-zinc-400">(list)</div>
        </div>
        {/* Controls bar */}
        <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-zinc-950/50 p-3">
          <div className="text-sm text-zinc-400">Analysis controls</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetBoard}
              className="rounded-md border border-white/10 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800"
            >
              New Game / Reset
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
