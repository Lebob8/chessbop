"use client";

type PlayVsEngineControlsProps = {
  playVsEngine: boolean;
  onTogglePlayVsEngine: () => void;
  difficulty: "easy" | "medium" | "hard" | "very-hard";
  onDifficultyChange: (value: "easy" | "medium" | "hard" | "very-hard") => void;
  showEngineTurnArrows: boolean;
  onToggleEngineTurnArrows: () => void;
  opponentReady: boolean;
  opponentElo: number;
  isUserTurn: boolean;
};

/**
 * Small presentational component for the
 * "play vs computer" controls and status row.
 */
export function PlayVsEngineControls({
  playVsEngine,
  onTogglePlayVsEngine,
  difficulty,
  onDifficultyChange,
  showEngineTurnArrows,
  onToggleEngineTurnArrows,
  opponentReady,
  opponentElo,
  isUserTurn,
}: PlayVsEngineControlsProps) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onTogglePlayVsEngine}
        className={`rounded px-3 py-1.5 text-xs font-medium transition ${
          playVsEngine
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
        }`}
      >
        {playVsEngine ? "Stop Play vs Computer" : "Play vs Computer"}
      </button>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">Difficulty</span>
        <select
          value={difficulty}
          onChange={(e) =>
            onDifficultyChange(
              e.target.value as "easy" | "medium" | "hard" | "very-hard",
            )
          }
          className="rounded border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
        >
          <option value="easy">Easy (400)</option>
          <option value="medium">Medium (1350)</option>
          <option value="hard">Hard (2200)</option>
          <option value="very-hard">Very Hard (3000)</option>
        </select>
      </div>
      {playVsEngine && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Engine turn arrows</span>
          <button
            type="button"
            onClick={onToggleEngineTurnArrows}
            className={`rounded px-2 py-1 text-[11px] font-medium transition ${
              showEngineTurnArrows
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            }`}
          >
            {showEngineTurnArrows ? "Shown" : "Hidden"}
          </button>
        </div>
      )}
      {playVsEngine && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span>{opponentReady ? "Engine ready" : "Engine starting..."}</span>
          <span>Strength: ~ELO {opponentElo}</span>
          {opponentReady && !isUserTurn && (
            <span className="text-amber-400">Engine thinking&hellip;</span>
          )}
        </div>
      )}
    </div>
  );
}

