"use client";

import { useEffect, useMemo, useState } from "react";
import ChessBoard from "@/components/ChessBoard";
import { useEngine } from "@/core/engine";
import { Chess } from "chess.js";
import { EvalBar } from "@/components/analysis/EvalBar";
import EnginePanel from "@/components/analysis/EnginePanel";
import { MoveListTree } from "../MoveListTree";
import { Controls } from "@/components/Controls";
import { VariationControls } from "../VariationControls";
import { GameTree } from "@/core/chess";
import type { Move } from "@/core/chess";

export default function AnalysisView() {
  const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const [gameTree] = useState(() => new GameTree(START_FEN));
  const [boardKey, setBoardKey] = useState(0);
  const [currentFen, setCurrentFen] = useState(START_FEN);
  const [treeVersion, setTreeVersion] = useState(0); // Trigger re-renders on tree changes
  const [engineEnabled, setEngineEnabled] = useState(true);
  const [analysisDepth, setAnalysisDepth] = useState(15);
  const [orientation, setOrientation] = useState<"white" | "black">("white");

  const { analysis, start, stop, analyze, isReady, isAnalyzing } = useEngine({
    autoStart: true,
    defaultOptions: { depth: analysisDepth, threads: 1, hash: 16 },
  });

  const resetBoard = () => {
    gameTree.reset(START_FEN);
    setBoardKey((k) => k + 1);
    setCurrentFen(START_FEN);
    setTreeVersion((v) => v + 1);
  };

  const handleMove = (fen: string) => {
    setCurrentFen(fen);
  };

  const handleMoveDetail = (info: { fen: string; san: string; color: "w" | "b"; from: string; to: string }) => {
    const move: Move = {
      san: info.san,
      from: info.from,
      to: info.to,
      color: info.color,
    };
    
    // GameTree.addMove auto-handles variations vs following existing moves
    gameTree.addMove(move, info.fen);
    setCurrentFen(info.fen);
    setTreeVersion((v) => v + 1);
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

  // Navigation handlers
  const goToStart = () => {
    gameTree.goToStart();
    setCurrentFen(gameTree.getCurrent().fen);
    setBoardKey((k) => k + 1);
    setTreeVersion((v) => v + 1);
  };

  const goToPrev = () => {
    if (gameTree.goBack()) {
      setCurrentFen(gameTree.getCurrent().fen);
      setBoardKey((k) => k + 1);
      setTreeVersion((v) => v + 1);
    }
  };

  const goToNext = () => {
    if (gameTree.goForward()) {
      setCurrentFen(gameTree.getCurrent().fen);
      setBoardKey((k) => k + 1);
      setTreeVersion((v) => v + 1);
    }
  };

  const goToEnd = () => {
    gameTree.goToEnd();
    setCurrentFen(gameTree.getCurrent().fen);
    setBoardKey((k) => k + 1);
    setTreeVersion((v) => v + 1);
  };

  // Analyze position when FEN changes and engine is enabled (skip terminal positions)
  useEffect(() => {
    if (!engineEnabled || !isReady || !currentFen) return;
    const c = new Chess(currentFen);
    if (c.isGameOver()) return; // avoid analyzing checkmate/stalemate positions
    analyze(currentFen, { depth: analysisDepth });
  }, [currentFen, engineEnabled, isReady, analysisDepth, analyze, treeVersion]);

  // Game over banner message
  const gameOverInfo = useMemo(() => {
    try {
      const c = new Chess(currentFen);
      if (!c.isGameOver()) return null;
      if (c.isCheckmate()) {
        const winner = c.turn() === "w" ? "Black" : "White";
        return { label: `Checkmate — ${winner} wins` };
      }
      if (c.isStalemate()) return { label: "Draw — stalemate" };
      if (c.isInsufficientMaterial()) return { label: "Draw — insufficient material" };
      if (c.isDraw()) return { label: "Draw" };
      return { label: "Game over" };
    } catch {
      return null;
    }
  }, [currentFen]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,700px)_minmax(260px,1fr)] lg:grid-cols-[minmax(0,800px)_minmax(320px,1fr)]">
      {/* Board area */}
      <section className="flex items-start gap-1">
        <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-3">
          <ChessBoard 
            key={boardKey} 
            initialFen={currentFen} 
            onMove={handleMove} 
            onMoveDetail={handleMoveDetail} 
            orientation={orientation}
            lastMove={gameTree.getCurrent().move ? [gameTree.getCurrent().move!.from, gameTree.getCurrent().move!.to] : undefined}
          />
          {gameOverInfo && (
            <div className="mt-3 flex items-center justify-between rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-200">
              <span>{gameOverInfo.label}</span>
              <button
                type="button"
                onClick={resetBoard}
                className="rounded-md border border-white/10 bg-zinc-800 px-2 py-1 text-xs hover:bg-zinc-700"
              >
                New Game
              </button>
            </div>
          )}
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
          <div className="h-72">
            <MoveListTree
              rootNode={gameTree.getRoot()}
              currentNode={gameTree.getCurrent()}
              treeVersion={treeVersion}
              onNodeClick={(nodeId) => {
                if (gameTree.setCurrentById(nodeId)) {
                  setCurrentFen(gameTree.getCurrent().fen);
                  setBoardKey((k) => k + 1);
                  setTreeVersion((v) => v + 1);
                }
              }}
            />
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex w-full flex-col gap-3 rounded-lg border border-white/10 bg-zinc-950/50 p-3">
          <Controls
            state={{ phase: isAnalyzing ? 'analyzing' : 'idle' }}
            positionIndex={!gameTree.getCurrent().parent ? 0 : 1}
            total={gameTree.getCurrent().children.length > 0 ? 2 : 1}
            onReset={goToStart}
            onPrev={goToPrev}
            onNext={goToNext}
            onLast={goToEnd}
            onAnalyzeAll={() => {}}
            onPause={() => {}}
            onResume={() => {}}
          />
        </div>

        {/* Variation Controls */}
        <VariationControls
          key={treeVersion}
          gameTree={gameTree}
          onTreeChange={() => {
            setCurrentFen(gameTree.getCurrent().fen);
            setBoardKey((k) => k + 1);
            setTreeVersion((v) => v + 1);
          }}
        />

        <div className="flex w-full flex-col gap-3 rounded-lg border border-white/10 bg-zinc-950/50 p-3">
          {/* Settings row */}
          <div className="flex items-center justify-between gap-2">
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
            </div>
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
