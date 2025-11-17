"use client";

import { useEffect, useRef, useState } from "react";
import { Chessground } from "chessground";
import type { Api } from "chessground/api";
import { Chess } from "chess.js";
import type { Key } from "chessground/types";

interface ChessBoardProps {
  initialFen?: string;
  orientation?: "white" | "black";
  onMove?: (fen: string) => void;
  onMoveDetail?: (info: { fen: string; san: string; color: "w" | "b"; from: string; to: string }) => void;
  lastMove?: [string, string];
}

export default function ChessBoard({
  initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  orientation = "white",
  onMove,
  onMoveDetail,
  lastMove,
}: ChessBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const [chess] = useState(() => new Chess(initialFen));

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
        color: "both",
        dests: toDests(chess),
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
                color: toColor(chess),
                dests: toDests(chess),
              },
            });
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

    return () => {
      cg.destroy();
    };
  }, [orientation, onMove, onMoveDetail, lastMove]);

  // Update board position when initialFen changes without re-initializing Chessground
  useEffect(() => {
    if (!cgRef.current) return;
    if (!initialFen) return;

    if (initialFen !== chess.fen()) {
      try {
        chess.load(initialFen);
        cgRef.current.set({
          fen: chess.fen(),
          turnColor: toColor(chess),
          animation: { enabled: true, duration: 180 },
          lastMove: lastMove ? [lastMove[0] as Key, lastMove[1] as Key] : undefined,
          movable: {
            color: toColor(chess),
            dests: toDests(chess),
          },
        });
      } catch (_e) {
        // ignore invalid FEN loads
      }
    }
  }, [initialFen, chess, lastMove]);

  // Update lastMove highlighting independently when it changes
  useEffect(() => {
    if (!cgRef.current) return;
    cgRef.current.set({
      lastMove: lastMove ? [lastMove[0] as Key, lastMove[1] as Key] : undefined,
    });
  }, [lastMove]);

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
