"use client";

import { useState } from "react";
import { BoardEditor } from "@/components/editor/BoardEditor";
import { editorStateFromFEN, editorStateToFEN, startPositionState, type EditorState, type PieceCode, type Square } from "@/components/editor/editorTypes";
import { Chess } from "chess.js";
import { PiecePalette, type EditorTool } from "@/components/editor/PiecePalette";
import { useRouter } from "next/navigation";

export default function EditorPage() {
  const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const [fen, setFen] = useState(START_FEN);
  const [editorState, setEditorState] = useState<EditorState>(() => editorStateFromFEN(START_FEN));
  const [selectedTool, setSelectedTool] = useState<EditorTool>("move");
  const router = useRouter();
  const [orientation, setOrientation] = useState<"white"|"black">("white");
  const computedFen = editorStateToFEN(editorState);
  const validateFen = (fenStr: string): { ok: boolean; error?: string } => {
    try {
      // chess.js v1: validate_fen available on instance; fallback to try/catch
      const c = new Chess();
      let valid = true;
      let error: string | undefined = undefined;
      if (typeof (c as { validate_fen?: unknown }).validate_fen === "function") {
        const res = (c as unknown as { validate_fen: (fen: string) => { valid: boolean; error?: string } }).validate_fen(fenStr);
        valid = res.valid;
        error = res.error;
      }
      if (!valid) return { ok: false, error };
      new Chess(fenStr);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  };
  // Extra guard: ensure castling rights match pieces on starting squares
  const validateCastlingConsistency = (state: EditorState): { ok: boolean; error?: string } => {
    try {
      const c = state.options.castling;
      const has = (sq: Square, pc: PieceCode) => state.pieces[sq] === pc;
      const inconsistencies: string[] = [];
      if (c.K && !(has("e1", "wK") && has("h1", "wR"))) inconsistencies.push("K");
      if (c.Q && !(has("e1", "wK") && has("a1", "wR"))) inconsistencies.push("Q");
      if (c.k && !(has("e8", "bK") && has("h8", "bR"))) inconsistencies.push("k");
      if (c.q && !(has("e8", "bK") && has("a8", "bR"))) inconsistencies.push("q");
      if (inconsistencies.length > 0) {
        return { ok: false, error: `invalid castling rights (${inconsistencies.join(",")})` };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "invalid castling rights" };
    }
  };
  const inputStatus = validateFen(fen);
  const computedStatus = validateFen(computedFen);
  const castlingStatus = validateCastlingConsistency(editorState);
  const computedValid = computedStatus.ok && castlingStatus.ok;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Board Editor</h1>
        <a
          href="/analysis"
          className="rounded border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
        >
          Open Analysis
        </a>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,560px)_minmax(260px,1fr)]">
        <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-4">
          <BoardEditor
            fen={editorStateToFEN(editorState)}
            width={500}
            height={500}
            selectedTool={selectedTool}
            orientation={orientation}
            onSquareClick={(square: Square) => {
              setEditorState((prev) => {
                const next = { ...prev, pieces: { ...prev.pieces } };
                if (selectedTool === "erase") {
                  delete next.pieces[square];
                } else if (typeof selectedTool === "string" && selectedTool.length === 2) {
                  next.pieces[square] = selectedTool as PieceCode;
                }
                return next;
              });
            }}
            onMove={(orig: Square, dest: Square) => {
              setEditorState((prev) => {
                const pc = prev.pieces[orig];
                if (!pc) return prev;
                const next = { ...prev, pieces: { ...prev.pieces } };
                next.pieces[dest] = pc;
                delete next.pieces[orig];
                return next;
              });
            }}
          />
        </div>

        <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-4 space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-zinc-200">Piece Palette</h2>
            <PiecePalette
              selected={selectedTool}
              onSelect={(tool) => {
                // Toggle off piece selection if clicked again -> move mode
                if (tool !== "move" && tool === selectedTool) {
                  setSelectedTool("move");
                } else {
                  setSelectedTool(tool);
                }
              }}
            />
          </div>
          <div className="h-px w-full bg-white/10" />
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400">Orientation</label>
            <select
              className="rounded border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as "white" | "black")}
            >
              <option value="white">White</option>
              <option value="black">Black</option>
            </select>
          </div>
          <div className="h-px w-full bg-white/10" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Side to move</label>
              <select
                className="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                value={editorState.options.sideToMove}
                onChange={(e) =>
                  setEditorState((s) => ({ ...s, options: { ...s.options, sideToMove: e.target.value as "w" | "b" } }))
                }
              >
                <option value="w">White</option>
                <option value="b">Black</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">En passant</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e3 or -"
                  value={editorState.options.enPassant ?? "-"}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    setEditorState((s) => ({
                      ...s,
                      options: { ...s.options, enPassant: v === "-" || v === "" ? null : (v as Square) },
                    }));
                  }}
                  className="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                />
                {(() => {
                  const files = ["a","b","c","d","e","f","g","h"] as const;
                  const rank = editorState.options.sideToMove === "b" ? 3 : 6;
                  const opts = ["-", ...files.map((f) => `${f}${rank}`)];
                  const current = editorState.options.enPassant ?? "-";
                  return (
                    <select
                      className="rounded border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                      value={current}
                      onChange={(e) => {
                        const v = e.target.value as string;
                        setEditorState((s) => ({
                          ...s,
                          options: { ...s.options, enPassant: v === "-" ? null : (v as Square) },
                        }));
                      }}
                    >
                      {opts.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  );
                })()}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Castling rights</label>
            <div className="flex flex-wrap gap-2 text-xs">
              {(["K","Q","k","q"] as const).map((c) => (
                <label key={c} className="inline-flex items-center gap-1 rounded border border-white/10 bg-zinc-900 px-2 py-1">
                  <input
                    type="checkbox"
                    checked={editorState.options.castling[c]}
                    onChange={(e) =>
                      setEditorState((s) => ({
                        ...s,
                        options: { ...s.options, castling: { ...s.options.castling, [c]: e.target.checked } },
                      }))
                    }
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="h-px w-full bg-white/10" />
          <h2 className="mb-2 text-sm font-semibold text-zinc-200">Position</h2>
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">FEN</label>
            <textarea
              className="w-full resize-none rounded border border-white/10 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300"
              rows={3}
              value={fen}
              onChange={(e) => {
                const val = e.target.value;
                setFen(val);
                try { setEditorState(editorStateFromFEN(val)); } catch {}
              }}
            />
            <div className={`text-xs ${inputStatus.ok ? "text-emerald-400" : "text-red-400"}`}>
              {inputStatus.ok ? "Valid FEN" : `Invalid FEN: ${inputStatus.error ?? "Unknown error"}`}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <label className="text-xs text-zinc-400">Computed FEN (from editor state)</label>
            <textarea
              className="w-full resize-none rounded border border-white/10 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300"
              rows={3}
              value={computedFen}
              readOnly
            />
            <div className={`text-xs ${computedValid ? "text-emerald-400" : "text-red-400"}`}>
              {computedValid
                ? "Valid FEN"
                : `Invalid FEN: ${!castlingStatus.ok ? castlingStatus.error : (computedStatus.error ?? "Unknown error")}`}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
                onClick={() => { void navigator.clipboard?.writeText(computedFen); }}
              >
                Copy computed FEN
              </button>
              <button
                type="button"
                disabled={!computedValid}
                className={`rounded px-3 py-1.5 text-xs font-medium transition ${computedValid ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-zinc-800 text-zinc-400"}`}
                onClick={() => {
                  if (!computedValid) return;
                  const target = encodeURIComponent(computedFen);
                  router.push(`/analysis?fen=${target}`);
                }}
              >
                Analyze this position
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
              onClick={() => setEditorState({ pieces: {}, options: { sideToMove: "w", castling: { K:false,Q:false,k:false,q:false }, enPassant: null } })}
            >
              Clear board
            </button>
            <button
              type="button"
              className="rounded border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
              onClick={() => setEditorState(startPositionState())}
            >
              Start position
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
