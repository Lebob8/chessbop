"use client";

import type { PieceCode } from "@/components/editor/editorTypes";

export type EditorTool = "move" | "erase" | PieceCode;

const white: PieceCode[] = ["wK","wQ","wR","wB","wN","wP"];
const black: PieceCode[] = ["bK","bQ","bR","bB","bN","bP"];

type PiecePaletteProps = {
  selected: EditorTool;
  onSelect: (tool: EditorTool) => void;
};

export function PiecePalette({ selected, onSelect }: PiecePaletteProps) {
  const renderBtn = (pc: PieceCode) => (
    <button
      key={pc}
      type="button"
      className={`rounded border px-2 py-1 text-sm ${selected === pc ? "border-blue-400 bg-blue-600/20" : "border-white/10 bg-zinc-900 hover:bg-zinc-800"}`}
      onClick={() => onSelect(pc)}
      title={pc}
    >
      {pc}
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400 w-14">Mode</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded border px-2 py-1 text-xs ${selected === "move" ? "border-emerald-400 bg-emerald-600/20" : "border-white/10 bg-zinc-900 hover:bg-zinc-800"}`}
            onClick={() => onSelect("move")}
            title="Move pieces"
          >
            Move
          </button>
          <button
            type="button"
            className={`rounded border px-2 py-1 text-xs ${selected === "erase" ? "border-amber-400 bg-amber-600/20" : "border-white/10 bg-zinc-900 hover:bg-zinc-800"}`}
            onClick={() => onSelect("erase")}
            title="Erase pieces"
          >
            Erase
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400 w-14">White</span>
        <div className="flex flex-wrap gap-2">{white.map(renderBtn)}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400 w-14">Black</span>
        <div className="flex flex-wrap gap-2">{black.map(renderBtn)}</div>
      </div>
    </div>
  );
}
