"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ChessBoard from "@/components/ChessBoard";
import { OpponentEngine, type OpponentConfig, useEngine } from "@/core/engine";
import { Chess } from "chess.js";
import { EvalBar } from "@/components/analysis/EvalBar";
import EnginePanel from "@/components/analysis/EnginePanel";
import { PlayVsEngineControls } from "@/components/analysis/PlayVsEngineControls";
import { FenPgnControls } from "@/components/analysis/FenPgnControls";
import { GameOverBanner } from "@/components/analysis/GameOverBanner";
import { OpeningPanel } from "@/components/analysis/OpeningPanel";
import { classifyOpeningFromNode, type OpeningEntry, fenToEpd, getBookMovesByEpd } from "@/core/chess";
import { MoveListTree } from "../MoveListTree";
import { Controls } from "@/components/Controls";
import { VariationControls } from "../VariationControls";
import { GameTree } from "@/core/chess";
import type { Move } from "@/core/chess";
import { useBoardArrows } from "@/hooks/useBoardArrows";
import { useChessSounds } from "@/hooks/useChessSounds";

type MoveArrow = { from: string; to: string };
type BestMoveDetails = {
  label?: string;
  arrow?: MoveArrow;
};

type GameOverInfo = {
  label: string;
};

/**
 * Derive a readable best-move label and arrow
 * from the engine's primary PV and current FEN.
 */
function getBestMoveDetails(
  bestMoveUci: string | undefined,
  currentFen: string,
): BestMoveDetails {
  if (!bestMoveUci || !currentFen) {
    return { label: undefined, arrow: undefined };
  }

  const chessForBestMove = new Chess(currentFen);
  const promotionPiece =
    bestMoveUci.length === 5
      ? (bestMoveUci[4] as "q" | "r" | "b" | "n")
      : undefined;

  let sanLabel: string | undefined;
  let arrow: MoveArrow | undefined;

  try {
    const move = chessForBestMove.move({
      from: bestMoveUci.slice(0, 2),
      to: bestMoveUci.slice(2, 4),
      promotion: promotionPiece,
    });

    sanLabel = move?.san;

    if (move) {
      arrow = { from: move.from, to: move.to };
    }
  } catch {
    // If Chess.js rejects the move (e.g. stale eval vs current FEN),
    // fall back to drawing the arrow directly from the UCI string.
    if (bestMoveUci.length >= 4) {
      arrow = {
        from: bestMoveUci.slice(0, 2),
        to: bestMoveUci.slice(2, 4),
      };
    }
  }

  return {
    label: sanLabel || bestMoveUci,
    arrow,
  };
}

/**
 * Compute a concise game-over message from the current FEN.
 */
function getGameOverInfo(currentFen: string): GameOverInfo | null {
  try {
    const c = new Chess(currentFen);
    if (!c.isGameOver()) return null;

    if (c.isCheckmate()) {
      const winner = c.turn() === "w" ? "Black" : "White";
      return { label: `Checkmate � ${winner} wins` };
    }

    if (c.isStalemate()) return { label: "Draw � stalemate" };
    if (c.isInsufficientMaterial())
      return { label: "Draw � insufficient material" };
    if (c.isDraw()) return { label: "Draw" };

    return { label: "Game over" };
  } catch {
    return null;
  }
}

export default function AnalysisView() {
  // Base chess position (start of a new game)
  const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  // Core game state (tree of moves + current position)
  const [gameTree] = useState(() => new GameTree(START_FEN));
  const [boardKey, setBoardKey] = useState(0);
  const [currentFen, setCurrentFen] = useState(START_FEN);
  const [treeVersion, setTreeVersion] = useState(0); // Trigger re-renders on tree changes

  // Engine / analysis settings
  const [engineEnabled, setEngineEnabled] = useState(true);
  const [analysisDepth, setAnalysisDepth] = useState(15);
  const [showBestMove, setShowBestMove] = useState(true);

  // Board / user interaction state
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [playVsEngine, setPlayVsEngine] = useState(false);
  const [opponentElo, setOpponentElo] = useState(1350);
  const [opponentMovetime, setOpponentMovetime] = useState(350);
  const [opponentReady, setOpponentReady] = useState(false);
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard" | "very-hard"
  >("medium");
  const [showEngineTurnArrows, setShowEngineTurnArrows] = useState(false);

  // Import / export inputs
  const [fenInput, setFenInput] = useState<string | null>(null);
  const [fenError, setFenError] = useState<string | null>(null);
  const [pgnInput, setPgnInput] = useState("");
  const [pgnError, setPgnError] = useState<string | null>(null);
  const [showBookSuggestions, setShowBookSuggestions] = useState(true);
  const opening = useMemo<OpeningEntry | null>(() => {
    void treeVersion;
    void currentFen;
    try {
      return classifyOpeningFromNode(gameTree.getCurrent());
    } catch {
      return null;
    }
  }, [gameTree, treeVersion, currentFen]);

  const bookMoves = useMemo<string[]>(() => {
    try {
      const epd = fenToEpd(currentFen);
      return getBookMovesByEpd(epd);
    } catch {
      return [];
    }
  }, [currentFen]);

  // Imperative refs for opponent engine & timers
  const opponentRef = useRef<OpponentEngine | null>(null);
  const mountedRef = useRef(true);
  const engineMoveTimeoutRef = useRef<number | null>(null);
  const lastEngineRequestRef = useRef<string | null>(null);
  const { play, playMove } = useChessSounds();

  const { analysis, start, stop, analyze, isReady, isAnalyzing } = useEngine({
    autoStart: true,
    defaultOptions: { depth: analysisDepth, threads: 1, hash: 16 },
  });

  const bestMoveUci = analysis.evaluation?.pv?.[0];
  const bestMoveDetails = useMemo<BestMoveDetails>(
    () => getBestMoveDetails(bestMoveUci, currentFen),
    [bestMoveUci, currentFen],
  );
  const bestMoveLabel = bestMoveDetails.label;
  const bestMoveArrow = showBestMove ? bestMoveDetails.arrow : undefined;

  const userSide: "w" | "b" = orientation === "white" ? "w" : "b";
  const currentTurn: "w" | "b" =
    currentFen.split(" ")[1] === "b" ? "b" : "w";
  const isUserTurn = userSide === currentTurn;

  const currentNode = gameTree.getCurrent();
  const atHistory = currentNode.children.length > 0;
  const previewInHistory = atHistory && engineEnabled && isReady;

  const bookMovesForArrows = showBookSuggestions ? bookMoves : [];
  const derivedShowBestMove = showBestMove && !(showBookSuggestions && bookMoves.length > 0);
  const arrows = useBoardArrows({
    infoPv: analysis.evaluation?.pv ?? null,
    showArrows: derivedShowBestMove,
    engineOn: engineEnabled && isReady,
    playVsEngine,
    currentTurn,
    userSide,
    atHistory,
    previewInHistory,
    practiceOn: false,
    bookUCIs: bookMovesForArrows,
    showBookArrows: bookMovesForArrows.length > 0,
    hintPulse: 0,
    showEngineTurnArrows,
  });

  // Rebuild PGN export whenever the main line changes
  const pgnExport = useMemo(() => {
    // Tie recomputation to treeVersion since gameTree mutates in place
    void treeVersion;

    try {
      const mainLine = gameTree.getMainLine();
      if (!mainLine.length) {
        return "";
      }

      const root = mainLine[0];
      const rootFen = root.fen;
      const chessForPgn = new Chess(rootFen);

      if (rootFen !== START_FEN) {
        chessForPgn.header("SetUp", "1");
        chessForPgn.header("FEN", rootFen);
      }

      for (let i = 1; i < mainLine.length; i += 1) {
        const mv = mainLine[i].move;
        if (!mv) continue;
        chessForPgn.move({
          from: mv.from,
          to: mv.to,
          promotion: mv.promotion,
        });
      }

      return chessForPgn.pgn();
    } catch {
      return "";
    }
  }, [gameTree, treeVersion, START_FEN]);

  // Initialize opponent engine on mount
  useEffect(() => {
    mountedRef.current = true;
    const opponent = new OpponentEngine();
    opponentRef.current = opponent;

    opponent
      .initialize()
      .then(() => {
        if (!mountedRef.current) return;
        setOpponentReady(true);
      })
      .catch((err) => {
        console.error(
          "[AnalysisView] Opponent engine failed to initialize:",
          err,
        );
      });

    return () => {
      mountedRef.current = false;
      if (engineMoveTimeoutRef.current != null) {
        window.clearTimeout(engineMoveTimeoutRef.current);
        engineMoveTimeoutRef.current = null;
      }
      try {
        opponent.stop();
      } catch {
        // ignore
      }
      try {
        opponent.terminate();
      } catch {
        // ignore
      }
      opponentRef.current = null;
    };
  }, []);

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

  const toggleBestMoveDisplay = () => {
    setShowBestMove((prev) => !prev);
  };

  // Toggle play-vs-engine mode and stop any in-flight opponent search
  const togglePlayVsEngine = () => {
    setPlayVsEngine((prev) => {
      const next = !prev;
      if (!next) {
        try {
          opponentRef.current?.stop();
        } catch {
          // ignore
        }
      } else {
        // Reset last request so engine can move immediately when PvE is enabled
        lastEngineRequestRef.current = null;
      }
      return next;
    });
  };

  // Update opponent strength presets and clear any in-flight engine search
  const handleDifficultyChange = (value: "easy" | "medium" | "hard" | "very-hard") => {
    setDifficulty(value);
    switch (value) {
      case "easy":
        setOpponentElo(400);
        setOpponentMovetime(250);
        break;
      case "medium":
        setOpponentElo(1350);
        setOpponentMovetime(350);
        break;
      case "hard":
        setOpponentElo(2200);
        setOpponentMovetime(500);
        break;
      case "very-hard":
        setOpponentElo(3000);
        setOpponentMovetime(500);
        break;
    }
    // Cancel any in-flight engine search and allow a fresh request
    lastEngineRequestRef.current = null;
    try {
      opponentRef.current?.stop();
    } catch {
      // ignore
    }
  };

  const attemptEngineMove = useCallback(
    async (fen: string) => {
      if (!playVsEngine || !opponentReady) return;
      const opponent = opponentRef.current;
      if (!opponent || !opponent.isReady() || !mountedRef.current) return;

      const chess = new Chess(fen);
      if (chess.isGameOver()) return;

      const sideToMove: "w" | "b" = chess.turn();
      const engineTurn =
        (userSide === "w" && sideToMove === "b") ||
        (userSide === "b" && sideToMove === "w");
      if (!engineTurn) return;

      const key = `${fen}-${sideToMove}`;
      if (lastEngineRequestRef.current === key) return;
      lastEngineRequestRef.current = key;

      const cfg: OpponentConfig = {
        useLimitStrength: true,
        elo: opponentElo,
        movetimeMs: opponentMovetime,
      };

      try {
        console.log("[AnalysisView] Requesting opponent move", {
          fen,
          cfg,
        });
        const bestMoveUci = await opponent.bestMove(fen, cfg);
        if (!bestMoveUci || !mountedRef.current) return;

        const engineChess = new Chess(fen);
        const promotionPiece =
          bestMoveUci.length === 5
            ? (bestMoveUci[4] as "q" | "r" | "b" | "n")
            : undefined;
        const move = engineChess.move({
          from: bestMoveUci.slice(0, 2),
          to: bestMoveUci.slice(2, 4),
          promotion: promotionPiece,
        });
        if (!move) {
          console.warn(
            "[AnalysisView] Invalid engine move UCI:",
            bestMoveUci,
          );
          return;
        }

        const moveData: Move = {
          san: move.san,
          from: move.from,
          to: move.to,
          color: move.color as "w" | "b",
        };
        console.log("[AnalysisView] Applied opponent move", {
          uci: bestMoveUci,
          san: move.san,
          fenAfter: engineChess.fen(),
        });
        try {
          playMove(engineChess, move as { flags?: string });
        } catch {
          // ignore sound errors
        }
        gameTree.addMove(moveData, engineChess.fen());
        setCurrentFen(engineChess.fen());
        setTreeVersion((v) => v + 1);
      } catch (err) {
        console.error("[AnalysisView] Engine move failed:", err);
      }
    },
    [playVsEngine, opponentReady, userSide, opponentElo, opponentMovetime, gameTree, playMove],
  );

  // Trigger engine move automatically when it's the opponent's turn at the frontier
  useEffect(() => {
    if (!playVsEngine || !opponentReady) return;

    const currentNode = gameTree.getCurrent();
    const atLatest = currentNode.children.length === 0;
    if (!atLatest) return;

    const chess = new Chess(currentNode.fen);
    if (chess.isGameOver()) return;

    const sideToMove: "w" | "b" = chess.turn();
    const engineTurn =
      (userSide === "w" && sideToMove === "b") ||
      (userSide === "b" && sideToMove === "w");
    if (!engineTurn) return;

    if (engineMoveTimeoutRef.current != null) {
      window.clearTimeout(engineMoveTimeoutRef.current);
      engineMoveTimeoutRef.current = null;
    }

    engineMoveTimeoutRef.current = window.setTimeout(() => {
      void attemptEngineMove(currentNode.fen);
    }, 300);

    return () => {
      if (engineMoveTimeoutRef.current != null) {
        window.clearTimeout(engineMoveTimeoutRef.current);
        engineMoveTimeoutRef.current = null;
      }
    };
  }, [gameTree, playVsEngine, opponentReady, userSide, treeVersion, attemptEngineMove]);

  // Navigation handlers
  const goToStart = () => {
    gameTree.goToStart();
    setCurrentFen(gameTree.getCurrent().fen);
    setBoardKey((k) => k + 1);
    setTreeVersion((v) => v + 1);
    play("move");
  };

  const goToPrev = () => {
    if (gameTree.goBack()) {
      setCurrentFen(gameTree.getCurrent().fen);
      setBoardKey((k) => k + 1);
      setTreeVersion((v) => v + 1);
      play("move");
    }
  };

  const goToNext = () => {
    if (gameTree.goForward()) {
      setCurrentFen(gameTree.getCurrent().fen);
      setBoardKey((k) => k + 1);
      setTreeVersion((v) => v + 1);
      play("move");
    }
  };

  const goToEnd = () => {
    gameTree.goToEnd();
    setCurrentFen(gameTree.getCurrent().fen);
    setBoardKey((k) => k + 1);
    setTreeVersion((v) => v + 1);
    play("move");
  };

  const handlePlayBookUci = (uci: string) => {
    try {
      const chess = new Chess(currentFen);
      const promotion = uci.length === 5 ? (uci[4] as "q" | "r" | "b" | "n") : undefined;
      const move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion });
      if (!move) return;
      const moveData: Move = {
        san: move.san,
        from: move.from,
        to: move.to,
        color: move.color as "w" | "b",
        promotion: move.promotion as "q" | "r" | "b" | "n" | undefined,
      };
      try { playMove(chess, move as { flags?: string }); } catch {}
      gameTree.addMove(moveData, chess.fen());
      setCurrentFen(chess.fen());
      setBoardKey((k) => k + 1);
      setTreeVersion((v) => v + 1);
    } catch {}
  };

  // Analyze position when FEN changes and engine is enabled (skip terminal positions)
  useEffect(() => {
    if (!engineEnabled || !isReady || !currentFen) return;
    const c = new Chess(currentFen);
    if (c.isGameOver()) return; // avoid analyzing checkmate/stalemate positions
    analyze(currentFen, { depth: analysisDepth });
  }, [currentFen, engineEnabled, isReady, analysisDepth, analyze, treeVersion]);

  // Opening is derived via useMemo above; no effect needed

  const handleLoadFen = () => {
    const raw = (fenInput === null ? currentFen : fenInput).trim();
    if (!raw) {
      setFenError("Please paste a FEN string.");
      return;
    }
    try {
      const c = new Chess(raw);
      const normalizedFen = c.fen();
      gameTree.reset(normalizedFen);
      setCurrentFen(normalizedFen);
      setBoardKey((k) => k + 1);
      setTreeVersion((v) => v + 1);
      lastEngineRequestRef.current = null;
      setFenError(null);
    } catch {
      setFenError("Invalid FEN: please check the string and try again.");
    }
  };

  const handleLoadPgn = () => {
    const raw = pgnInput.trim();
    if (!raw) {
      setPgnError("Please paste a PGN string.");
      return;
    }
    try {
      const chessFromPgn = new Chess();
      // chess.js v1 exposes `loadPgn`; it throws on invalid PGN
      (chessFromPgn as unknown as { loadPgn: (pgn: string) => void }).loadPgn(raw);

      const headers = chessFromPgn.header();
      const headerFen = (headers as Record<string, string | undefined>).FEN;
      const headerSetUp = (headers as Record<string, string | undefined>).SetUp;
      const startFen = headerSetUp === "1" && headerFen ? headerFen : START_FEN;

      const chessReplay = new Chess(startFen);
      gameTree.reset(startFen);

      const moves = chessFromPgn.history({ verbose: true }) as Array<{
        san: string;
        from: string;
        to: string;
        color: "w" | "b";
        promotion?: string;
      }>;

      for (const mv of moves) {
        chessReplay.move({
          from: mv.from,
          to: mv.to,
          promotion: mv.promotion,
        });
        const moveData: Move = {
          san: mv.san,
          from: mv.from,
          to: mv.to,
          color: mv.color,
          promotion: mv.promotion as "q" | "r" | "b" | "n" | undefined,
        };
        gameTree.addMove(moveData, chessReplay.fen());
      }

      setCurrentFen(chessReplay.fen());
      setBoardKey((k) => k + 1);
      setTreeVersion((v) => v + 1);
      lastEngineRequestRef.current = null;
      setPgnError(null);
    } catch {
      setPgnError("Invalid PGN: please check the string and try again.");
    }
  };

  // Game over banner message
  const gameOverInfo = useMemo(
    () => getGameOverInfo(currentFen),
    [currentFen],
  );

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
            bestMoveArrow={bestMoveArrow}
            arrows={arrows}
            movable={!playVsEngine || isUserTurn}
            lastMove={gameTree.getCurrent().move ? [gameTree.getCurrent().move!.from, gameTree.getCurrent().move!.to] : undefined}
          />
          <GameOverBanner info={gameOverInfo} onReset={resetBoard} />
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
        {/* Opening panel */}
        <OpeningPanel
          opening={opening}
          bookMoves={bookMovesForArrows}
          currentFen={currentFen}
          onPlayBookUci={handlePlayBookUci}
          bookEnabled={showBookSuggestions}
          onToggleBookEnabled={() => setShowBookSuggestions((v) => !v)}
        />

        {/* Engine panel */}
        <EnginePanel
          engineEnabled={engineEnabled}
          onToggle={toggleEngine}
          analysis={analysis}
          isAnalyzing={isAnalyzing}
          analysisDepth={analysisDepth}
          onChangeDepth={(d) => setAnalysisDepth(d)}
          showBestMove={showBestMove}
          onToggleBestMove={toggleBestMoveDisplay}
          bestMoveLabel={bestMoveLabel}
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
                  play("move");
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
          {/* Board-side selector and reset */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label htmlFor="board-side" className="text-xs text-zinc-400">
                Side
              </label>
              <select
                id="board-side"
                value={orientation}
                onChange={(e) =>
                  setOrientation(e.target.value as "white" | "black")
                }
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

          <PlayVsEngineControls
            playVsEngine={playVsEngine}
            onTogglePlayVsEngine={togglePlayVsEngine}
            difficulty={difficulty}
            onDifficultyChange={handleDifficultyChange}
            showEngineTurnArrows={showEngineTurnArrows}
            onToggleEngineTurnArrows={() =>
              setShowEngineTurnArrows((prev) => !prev)
            }
            opponentReady={opponentReady}
            opponentElo={opponentElo}
            isUserTurn={isUserTurn}
          />

          <FenPgnControls
            currentFen={currentFen}
            fenInput={fenInput}
            onFenInputChange={setFenInput}
            onFenClear={() => {
              setFenInput("");
              setFenError(null);
            }}
            fenError={fenError}
            onLoadFen={handleLoadFen}
            pgnExport={pgnExport}
            pgnInput={pgnInput}
            onPgnInputChange={setPgnInput}
            onPgnClear={() => {
              setPgnInput("");
              setPgnError(null);
            }}
            pgnError={pgnError}
            onLoadPgn={handleLoadPgn}
          />
        </div>
      </aside>
    </div>
  );
}
