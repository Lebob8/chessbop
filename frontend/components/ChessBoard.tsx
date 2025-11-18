"use client";

import { useEffect, useRef, useState } from "react";
import { Chessground } from "chessground";
import type { Api } from "chessground/api";
import { Chess } from "chess.js";
import type { Key } from "chessground/types";
import type { BoardArrow } from "@/core/chess";

interface ChessBoardProps {
  initialFen?: string;
  orientation?: "white" | "black";
  onMove?: (fen: string) => void;
  onMoveDetail?: (info: { fen: string; san: string; color: "w" | "b"; from: string; to: string }) => void;
  lastMove?: [string, string];
  bestMoveArrow?: { from: string; to: string };
  arrows?: BoardArrow[];
  movable?: boolean;
}

export default function ChessBoard({
  initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  orientation = "white",
  onMove,
  onMoveDetail,
  lastMove,
  bestMoveArrow,
  arrows,
  movable = true,
}: ChessBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const [chess] = useState(() => new Chess(initialFen));
  const bestMoveArrowRef = useRef(bestMoveArrow);
  const arrowsRef = useRef<BoardArrow[] | undefined>(arrows);

  const applyArrows = (cg: Api) => {
    const activeArrows: BoardArrow[] = (() => {
      if (arrowsRef.current && arrowsRef.current.length > 0) {
        return arrowsRef.current;
      }
      const single = bestMoveArrowRef.current;
      if (single) {
        return [
          {
            startSquare: single.from,
            endSquare: single.to,
          },
        ];
      }
      return [];
    })();

    const shapes =
      activeArrows.length > 0
        ? activeArrows.map((arrow) => ({
            orig: arrow.startSquare as Key,
            dest: arrow.endSquare as Key,
            // Use a single Chessground brush; visual color can be themed via CSS if desired
            brush: "green",
          }))
        : [];

    cg.setAutoShapes(shapes);
  };

  // Avoid resetting the board mid-drag by checking Chessground internal drag state
  const isDragging = () => {
    try {
      return !!cgRef.current?.state?.draggable?.current;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!boardRef.current) return;

    const cg = Chessground(boardRef.current, {
      fen: chess.fen(),
      orientation,
      lastMove: lastMove ? [lastMove[0] as Key, lastMove[1] as Key] : undefined,
      highlight: {
        lastMove: true,
        check: true,
      },
      animation: {
        enabled: true,
        duration: 180,
      },
      movable: {
        free: false,
        color: movable ? "both" : undefined,
        dests: movable ? toDests(chess) : new Map(),
      },
      draggable: {
        enabled: true,
        showGhost: true,
      },
      events: {
        move: (orig: Key, dest: Key) => {
          const move = chess.move({
            from: orig,
            to: dest,
            promotion: "q",
          });

          if (move) {
            cg.set({
              fen: chess.fen(),
              turnColor: toColor(chess),
              lastMove: [orig, dest],
              movable: {
                color: movable ? toColor(chess) : undefined,
                dests: movable ? toDests(chess) : new Map(),
              },
            });
            applyArrows(cg);
            onMove?.(chess.fen());
            if (move && onMoveDetail) {
              onMoveDetail({ fen: chess.fen(), san: move.san, color: move.color as "w" | "b", from: move.from, to: move.to });
            }
          } else {
            cg.set({ fen: chess.fen() });
          }
        },
      },
    });

    cgRef.current = cg;
    applyArrows(cg);

    return () => {
      cg.destroy();
    };
  }, [orientation, onMove, onMoveDetail, movable]);

  // Update board position when initialFen changes without re-initializing Chessground
  useEffect(() => {
    if (!cgRef.current) return;
    if (!initialFen) return;

    // Skip FEN updates during a drag to prevent cancelling it
    if (isDragging()) return;

    if (initialFen !== chess.fen()) {
      chess.load(initialFen);
      cgRef.current.set({
        fen: chess.fen(),
        turnColor: toColor(chess),
        animation: { enabled: true, duration: 180 },
        lastMove: lastMove ? [lastMove[0] as Key, lastMove[1] as Key] : undefined,
        movable: {
          color: movable ? toColor(chess) : undefined,
          dests: movable ? toDests(chess) : new Map(),
        },
      });
      applyArrows(cgRef.current);
    }
  }, [initialFen, lastMove, movable]);

  // Update lastMove highlighting independently when it changes
  useEffect(() => {
    const cg = cgRef.current;
    if (!cg) return;
    if (isDragging()) return;
    cg.set({
      lastMove: lastMove ? [lastMove[0] as Key, lastMove[1] as Key] : undefined,
    });
    applyArrows(cg);
  }, [lastMove]);

  useEffect(() => {
    const cg = cgRef.current;
    if (!cg) return;
    bestMoveArrowRef.current = bestMoveArrow;
    if (isDragging()) return;
    applyArrows(cg);
  }, [bestMoveArrow]);

  useEffect(() => {
    const cg = cgRef.current;
    if (!cg) return;
    arrowsRef.current = arrows;
    if (isDragging()) return;
    applyArrows(cg);
  }, [arrows]);

  return (
    <div className="relative inline-block">
      <div ref={boardRef} className="h-[500px] w-[500px]" />
    </div>
  );
}

function toDests(chess: Chess): Map<Key, Key[]> {
  const dests = new Map<Key, Key[]>();
  const moves = chess.moves({ verbose: true });

  for (const move of moves) {
    const from = move.from as Key;
    const to = move.to as Key;

    if (!dests.has(from)) {
      dests.set(from, []);
    }
    dests.get(from)!.push(to);
  }

  return dests;
}

function toColor(chess: Chess): "white" | "black" {
  return chess.turn() === "w" ? "white" : "black";
}



