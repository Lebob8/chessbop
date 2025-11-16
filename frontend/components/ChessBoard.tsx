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
}

export default function ChessBoard({
  initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  orientation = "white",
  onMove,
}: ChessBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const [chess] = useState(() => new Chess(initialFen));

  useEffect(() => {
    if (!boardRef.current) return;

    const cg = Chessground(boardRef.current, {
      fen: initialFen,
      orientation,
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
              movable: {
                color: toColor(chess),
                dests: toDests(chess),
              },
            });
            onMove?.(chess.fen());
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
  }, [chess, initialFen, orientation, onMove]);

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
