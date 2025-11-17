"use client";

type AnalyzerState = { phase: 'idle' | 'analyzing' | 'paused' | 'cancelling' };

export function Controls({
  state,
  positionIndex,
  total,
  onReset,
  onPrev,
  onNext,
  onLast,
  onAnalyzeAll,
  onPause,
  onResume,
  navDisabled,
  navDisabledTitle,
}: {
  state: AnalyzerState;
  positionIndex: number;
  total: number;
  onReset: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  onAnalyzeAll: () => void;
  onPause: () => void;
  onResume: () => void;
  navDisabled?: boolean;
  navDisabledTitle?: string;
}) {
  const atStart = positionIndex <= 0;
  const atEnd = positionIndex >= total;
  const paused = state.phase === 'paused';
  
  const btnClass = "rounded border border-white/10 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed";
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button className={btnClass} title={navDisabled ? (navDisabledTitle || '') : "Go to start"} disabled={atStart || !!navDisabled} onClick={onReset}>|◀</button>
      <button className={btnClass} title={navDisabled ? (navDisabledTitle || '') : "Previous move"} disabled={atStart || !!navDisabled} onClick={onPrev}>◀</button>
      <button className={btnClass} title={navDisabled ? (navDisabledTitle || '') : "Next move"} disabled={atEnd || !!navDisabled} onClick={onNext}>▶</button>
      <button className={btnClass} title={navDisabled ? (navDisabledTitle || '') : "Go to end"} disabled={atEnd || !!navDisabled} onClick={onLast}>▶|</button>
      <button className={btnClass} disabled={true} onClick={onAnalyzeAll}>Analyze all</button>
      {!paused ? (
        <button className={btnClass} disabled={true} onClick={onPause}>Pause</button>
      ) : (
        <button className={btnClass} disabled={true} onClick={onResume}>Resume</button>
      )}
    </div>
  );
}
