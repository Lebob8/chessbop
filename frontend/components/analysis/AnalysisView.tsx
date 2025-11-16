"use client";

import { useEffect, useState } from "react";
import ChessBoard from "@/components/ChessBoard";
import { useEngine } from "@/core/engine";
import { EvalBar } from "@/components/analysis/EvalBar";
import EnginePanel from "@/components/analysis/EnginePanel";

export default function AnalysisView() {
  const [boardKey, setBoardKey] = useState(0);
  const [currentFen, setCurrentFen] = useState(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );
  const [engineEnabled, setEngineEnabled] = useState(true);
  const [analysisDepth, setAnalysisDepth] = useState(15);
  const [orientation, setOrientation] = useState<"white" | "black">("white");

  const { analysis, start, stop, analyze, isReady, isAnalyzing } = useEngine({
    autoStart: true,
    defaultOptions: { depth: analysisDepth, threads: 1, hash: 16 },
  });

  const resetBoard = () => {
    setBoardKey((k) => k + 1);
    setCurrentFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  };

  const handleMove = (fen: string) => {
    setCurrentFen(fen);
  };

  const toggleEngine = async () => {
    if (engineEnabled) {
      stop();
      setEngineEnabled(false);
    } else {
      await start();
      setEngineEnabled(true);
    }
  };

  // Analyze position when FEN changes and engine is enabled
  useEffect(() => {
    if (engineEnabled && isReady && currentFen) {
      analyze(currentFen, { depth: analysisDepth });
    }
  }, [currentFen, engineEnabled, isReady, analysisDepth, analyze]);

  // formatting now handled inside EnginePanel

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,700px)_minmax(260px,1fr)] lg:grid-cols-[minmax(0,800px)_minmax(320px,1fr)]">
      {/* Board area */}
      <section className="flex items-start gap-3">
        <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-3">
          <ChessBoard key={boardKey} onMove={handleMove} orientation={orientation} />
        </div>
        {/* Vertical evaluation bar (hidden on small screens) */}
        <div className="hidden md:block">
          <EvalBar
            evalCp={analysis.evaluation?.cp}
            mate={analysis.evaluation?.mate}
            orientation="vertical"
            heightPx={500}
            railWidthPx={20}
            showLabel={true}
          />
        </div>
      </section>

      {/* Sidepanel */}
      <aside className="flex min-h-[500px] flex-col gap-4">
        {/* Horizontal eval bar for small screens (follows sidepanel below) */}
        <div className="w-full md:hidden">
          <EvalBar
            evalCp={analysis.evaluation?.cp}
            mate={analysis.evaluation?.mate}
            orientation="horizontal"
            heightPx={12}
            showLabel={true}
          />
        </div>
        {/* Engine panel */}
        <EnginePanel
          engineEnabled={engineEnabled}
          onToggle={toggleEngine}
          analysis={analysis}
          isAnalyzing={isAnalyzing}
          analysisDepth={analysisDepth}
          onChangeDepth={(d) => setAnalysisDepth(d)}
        />

        {/* Move List panel */}
        <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-zinc-200">
            Move List
          </h3>
          <div className="h-72 overflow-auto text-sm text-zinc-400">
            (move list coming in Phase 4)
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-zinc-950/50 p-3">
          <div className="text-sm text-zinc-400">Analysis controls</div>
          <div className="flex items-center gap-2">
            <label htmlFor="board-side" className="text-xs text-zinc-400">
              Side
            </label>
            <select
              id="board-side"
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as "white" | "black")}
              className="rounded border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
            >
              <option value="white">White</option>
              <option value="black">Black</option>
            </select>
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
