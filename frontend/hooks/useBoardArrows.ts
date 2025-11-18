"use client";

import { useMemo } from "react";
import type { BoardArrow } from "@/core/chess";

type Turn = "w" | "b";

interface UseBoardArrowsParams {
  infoPv?: string[] | null;
  showArrows: boolean;
  engineOn: boolean;
  playVsEngine: boolean;
  currentTurn: Turn;
  userSide: Turn;
  atHistory: boolean;
  previewInHistory: boolean;
  practiceOn: boolean;
  bookUCIs?: string[];
  showBookArrows: boolean;
  hintPulse: number;
  showEngineTurnArrows: boolean;
}

export function useBoardArrows(params: UseBoardArrowsParams): BoardArrow[] | undefined {
  const {
    infoPv,
    showArrows,
    engineOn,
    playVsEngine,
    currentTurn,
    userSide,
    atHistory,
    previewInHistory,
    practiceOn,
    bookUCIs,
    showBookArrows,
    hintPulse,
    showEngineTurnArrows,
  } = params;

  return useMemo(() => {
    const bestMove = infoPv && infoPv.length > 0 ? infoPv[0] : null;

    if (practiceOn) {
      if (bookUCIs && bookUCIs.length > 0) {
        const uci = (bookUCIs[0] || "").toLowerCase();
        if (uci.length >= 4) {
          const from = uci.substring(0, 2);
          const to = uci.substring(2, 4);
          if (showBookArrows || hintPulse) {
            // Book / hint arrows (kept distinct for future styling)
            const color: BoardArrow["color"] = "blue";
            return [{ startSquare: from, endSquare: to, color }];
          }
          return undefined;
        }
      }
    }

    if (atHistory && previewInHistory) {
      if (!engineOn || !bestMove || bestMove.length < 4) return undefined;
      const from = bestMove.substring(0, 2);
      const to = bestMove.substring(2, 4);
      // History ghost arrow: same color as normal best-move hint
      return [
        {
          startSquare: from,
          endSquare: to,
          color: "rgba(97, 86, 86, 0.55)",
        },
      ];
    }

    if (!engineOn || !bestMove || bestMove.length < 4) {
      return undefined;
    }

    const engineTurn =
      playVsEngine &&
      ((userSide === "w" && currentTurn === "b") ||
        (userSide === "b" && currentTurn === "w"));

    if (engineTurn) {
      if (!showEngineTurnArrows) return undefined;
    } else {
      if (!showArrows) return undefined;
    }

    const from = bestMove.substring(0, 2);
    const to = bestMove.substring(2, 4);
    // Default best-move hint arrow: transparent gray
    return [
      {
        startSquare: from,
        endSquare: to,
        color: "rgba(97, 86, 86, 0.55)",
      },
    ];
  }, [
    infoPv,
    showArrows,
    engineOn,
    playVsEngine,
    currentTurn,
    userSide,
    atHistory,
    previewInHistory,
    practiceOn,
    bookUCIs,
    showBookArrows,
    hintPulse,
    showEngineTurnArrows,
  ]);
}
