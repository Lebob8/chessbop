"use client";

import type { EngineAnalysis } from "@/core/engine";

interface EnginePanelProps {
  engineEnabled: boolean;
  onToggle: () => void | Promise<void>;
  analysis: EngineAnalysis;
  isAnalyzing: boolean;
  analysisDepth: number;
  onChangeDepth: (depth: number) => void;
  showBestMove: boolean;
  onToggleBestMove: () => void;
  bestMoveLabel?: string;
}

export default function EnginePanel({
  engineEnabled,
  onToggle,
  analysis,
  isAnalyzing,
  analysisDepth,
  onChangeDepth,
  showBestMove,
  onToggleBestMove,
  bestMoveLabel,
}: EnginePanelProps) {
  const formatEval = () => {
    if (!analysis.evaluation) return "—";
    const { cp, mate } = analysis.evaluation;
    if (mate !== undefined) return `M${mate > 0 ? mate : -mate}`;
    if (cp !== undefined) {
      const pawns = (cp / 100).toFixed(2);
      return cp > 0 ? `+${pawns}` : pawns;
    }
    return "—";
  };

  const formatPV = () => {
    if (!analysis.evaluation?.pv.length) return "—";
    return analysis.evaluation.pv.slice(0, 6).join(" ");
  };

  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Engine</h3>
        <button
          type="button"
          onClick={onToggle}
          className={`rounded px-2 py-1 text-xs font-medium ${
            engineEnabled
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
          }`}
        >
          {engineEnabled ? "ON" : "OFF"}
        </button>
      </div>

      {analysis.state === "loading" && (
        <div className="text-sm text-zinc-400">Loading engine...</div>
      )}

      {analysis.state === "error" && (
        <div className="text-sm text-red-400">
          Error: {analysis.error || "Unknown error"}
        </div>
      )}

      {!engineEnabled && analysis.state === "idle" && (
        <div className="text-sm text-zinc-400">
          Enable engine to start analysis
        </div>
      )}

      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Evaluation:</span>
          <span
            className={`font-mono font-semibold ${
              analysis.evaluation?.mate !== undefined
                ? "text-blue-400"
                : analysis.evaluation?.cp && analysis.evaluation.cp > 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {isAnalyzing ? "..." : formatEval()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Depth:</span>
          <span className="font-mono text-zinc-300">
            {analysis.evaluation?.depth || "—"}
            {analysis.evaluation?.seldepth
              ? `/${analysis.evaluation.seldepth}`
              : ""}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Nodes:</span>
          <span className="font-mono text-zinc-300">
            {analysis.evaluation?.nodes.toLocaleString() || "—"}
          </span>
        </div>
      </div>

      <div className="mb-3 border-t border-white/10 pt-3">
        <div className="mb-1 text-xs text-zinc-400">Best line:</div>
        <div className="rounded bg-zinc-900 p-2 font-mono text-xs text-zinc-300">
          {formatPV()}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="depth-select" className="text-xs text-zinc-400">
            Depth:
          </label>
          <select
            id="depth-select"
            value={analysisDepth}
            onChange={(e) => onChangeDepth(Number(e.target.value))}
            className="rounded border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
            disabled={!engineEnabled}
          >
            <option value={10}>Fast (10)</option>
            <option value={15}>Normal (15)</option>
            <option value={20}>Deep (20)</option>
            <option value={25}>Very Deep (25)</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-400">Show best move</span>
          <button
            type="button"
            onClick={onToggleBestMove}
            className={`rounded px-2 py-1 text-xs font-medium transition ${
              showBestMove
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            } ${!engineEnabled ? "cursor-not-allowed opacity-60" : ""}`}
            aria-pressed={showBestMove}
            disabled={!engineEnabled}
          >
            {showBestMove ? "ON" : "OFF"}
          </button>
        </div>
      </div>
      {showBestMove && (
        <div className="mt-2 text-xs text-zinc-200">
          Best move:{" "}
          <span className="font-mono text-zinc-100">
            {bestMoveLabel || "—"}
          </span>
        </div>
      )}
    </div>
  );
}
