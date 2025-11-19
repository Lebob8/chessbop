"use client";

import { useEffect, useRef, MouseEvent } from "react";
import { Chessground } from "chessground";
import type { Api } from "chessground/api";
import type { Key } from "chessground/types";
import type { Square } from "@/components/editor/editorTypes";
import type { EditorTool } from "@/components/editor/PiecePalette";

type BoardEditorProps = {
  fen: string;
  onFenChange?: (fen: string) => void;
  width?: number;
  height?: number;
  selectedTool?: EditorTool; // 'move' | 'erase' | PieceCode
  onSquareClick?: (square: Square) => void;
  onMove?: (orig: Square, dest: Square) => void;
  orientation?: "white" | "black";
};

/**
 * Minimal Chessground setup for the editor
 */
export function BoardEditor({
  fen,
  onFenChange,
  width = 500,
  height = 500,
  selectedTool = "move",
  onSquareClick,
  onMove,
  orientation = "white",
}: BoardEditorProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const recentDragAtRef = useRef<number>(0);

  // Init Chessground once
  useEffect(() => {
    if (!boardRef.current) return;
    const cg = Chessground(boardRef.current, {
      fen,
      orientation,
      animation: { enabled: true, duration: 180 },
      highlight: { lastMove: false, check: true },
      movable: { free: true, color: "both" },
      draggable: { enabled: true, showGhost: true },
      events: {
        move: (orig: Key, dest: Key) => {
          recentDragAtRef.current = Date.now();
          if (onMove) onMove(orig as Square, dest as Square);
        },
        select: (key: Key) => {
          if (!onSquareClick) return;
          if (selectedTool === "move") return;
          if (Date.now() - recentDragAtRef.current < 200) return;
          onSquareClick(key as Square);
        },
      },
    });
    cgRef.current = cg;
    return () => cg.destroy();
  }, [orientation, onMove]);

  // Update FEN when prop changes
  useEffect(() => {
    if (!cgRef.current) return;
    cgRef.current.set({ fen, orientation });
  }, [fen, orientation]);

  // Toggle drag/move when in placement/erase mode
  useEffect(() => {
    if (!cgRef.current) return;
    const placing = selectedTool !== "move";
    const update = {
      movable: { free: !placing, color: placing ? undefined : "both" },
      draggable: { enabled: !placing, showGhost: true },
    } as Parameters<Api["set"]>[0];
    cgRef.current.set(update);
  }, [selectedTool]);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onSquareClick || !boardRef.current) return;
    if (selectedTool === "move") return; // ignore clicks in move mode
    // Ignore click immediately after a drag-drop move to prevent duplicate placement
    if (Date.now() - recentDragAtRef.current < 200) {
      return;
    }
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const sqSize = rect.width / 8;
    const fileIdx = Math.min(7, Math.max(0, Math.floor(x / sqSize)));
    const rankIdxFromTop = Math.min(7, Math.max(0, Math.floor(y / sqSize)));
    const files = ["a","b","c","d","e","f","g","h"] as const;
    let file: (typeof files)[number];
    let rank: number;
    if (orientation === "white") {
      file = files[fileIdx];
      rank = 8 - rankIdxFromTop;
    } else {
      file = files[7 - fileIdx];
      rank = 1 + rankIdxFromTop;
    }
    const square = `${file}${rank}` as Square;
    onSquareClick(square);
  };

  return (
    <div
      ref={boardRef}
      style={{ width, height, cursor: selectedTool === "move" ? "pointer" : "crosshair" }}
      onClick={handleClick}
    />
  );
}
