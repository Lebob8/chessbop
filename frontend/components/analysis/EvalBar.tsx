"use client";
import type React from "react";

function logistic(x: number): number {
  const v = 1 / (1 + Math.exp(-x / 400));
  return Math.max(0, Math.min(1, v));
}

export function EvalBar({ evalCp, mate, heightPx, showLabel = false, railWidthPx = 28, orientation = 'vertical' }: { evalCp?: number; mate?: number; heightPx?: number; showLabel?: boolean; railWidthPx?: number; orientation?: 'vertical' | 'horizontal' }) {
  let p = 0.5;
  let label = '';
  if (typeof mate === 'number') {
    p = mate > 0 ? 1 : 0;
    label = `#${mate}`;
  } else if (typeof evalCp === 'number') {
    const clamped = Math.max(-800, Math.min(800, evalCp));
    p = logistic(clamped);
    label = `${evalCp >= 0 ? '+' : ''}${(evalCp / 100).toFixed(1)}`;
  }
  const pct = Math.round(p * 100);
  if (orientation === 'horizontal') {
    const h = Math.max(6, Math.floor(heightPx || 12));
    return (
      <div className="w-full select-none" data-testid="eval-bar">
        {showLabel && (
          <div className="text-center text-[11px] opacity-80 mb-0.5">{label}</div>
        )}
        <div className="w-full bg-neutral-900 border border-neutral-700 rounded overflow-hidden" style={{ height: `${h}px` }}>
          <div className="bg-gray-400 h-full transition-all duration-300 ease-out" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }
  // vertical default
  const barStyle: React.CSSProperties = heightPx && heightPx > 0
    ? { height: `${Math.floor(heightPx)}px` }
    : { height: '100%' };
  const railStyle: React.CSSProperties = { width: Math.max(8, Math.floor(railWidthPx)), minWidth: Math.max(8, Math.floor(railWidthPx)) };
  return (
    <div className="h-full select-none flex" style={{ height: barStyle.height }} data-testid="eval-bar">
      <div
        className="bg-neutral-900 border border-neutral-700 rounded relative overflow-hidden"
        style={{ ...railStyle }}
      >
        <div className="absolute inset-x-0 bottom-0 bg-gray-400 transition-all duration-300 ease-out" style={{ height: `${pct}%` }} />
        {!showLabel ? null : (
          <div className="absolute left-1/2 -translate-x-1/2 top-1 text-[10px] opacity-80 select-none">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
