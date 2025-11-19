"use client";

export type GameOverInfo = { label: string };

type GameOverBannerProps = {
  info: GameOverInfo | null;
  onReset: () => void;
};

/**
 * Simple banner shown when the current position
 * is a finished game (checkmate, draw, etc.).
 */
export function GameOverBanner({ info, onReset }: GameOverBannerProps) {
  if (!info) return null;

  return (
    <div className="mt-3 flex items-center justify-between rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-200">
      <span>{info.label}</span>
      <button
        type="button"
        onClick={onReset}
        className="rounded-md border border-white/10 bg-zinc-800 px-2 py-1 text-xs hover:bg-zinc-700"
      >
        New Game
      </button>
    </div>
  );
}

