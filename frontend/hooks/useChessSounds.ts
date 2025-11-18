"use client";

import { useCallback } from "react";
import type { Chess } from "chess.js";
import { useUIPrefs } from "@/lib/ui/prefsStore";
import { playSound } from "@/lib/ui/sound";

type SoundKey = "move" | "capture" | "castle" | "promote" | "check" | "checkmate";

export function useChessSounds() {
  const { prefs } = useUIPrefs();

  const play = useCallback(
    (key: SoundKey) => {
      if (!prefs.soundEnabled) return;
      if (key === "move" || key === "castle" || key === "promote") {
        if (!prefs.soundMove) return;
        return playSound(key as "move" | "castle" | "promote");
      }
      if (key === "capture") {
        if (!prefs.soundCapture) return;
        return playSound("capture");
      }
      if (key === "check") {
        if (!prefs.soundCheck) return;
        return playSound("check");
      }
      if (key === "checkmate") {
        if (!prefs.soundGameEnd) return;
        return playSound("checkmate");
      }
      return;
    },
    [prefs],
  );

  const playMove = useCallback(
    (chess: Chess, move: { flags?: string }) => {
      const flags = move.flags ?? "";
      // Checkmate has highest priority
      if (chess.isCheckmate()) {
        play("checkmate");
        return;
      }
      // Capture (normal or en passant)
      if (flags.includes("c") || flags.includes("e")) {
        play("capture");
        return;
      }
      // Promotion
      if (flags.includes("p")) {
        play("promote");
        return;
      }
      // Castling
      if (flags.includes("k") || flags.includes("q")) {
        play("castle");
        return;
      }
      // Check (but not mate)
      if (chess.isCheck()) {
        play("check");
        return;
      }
      // Quiet move
      play("move");
    },
    [play],
  );

  return { play, playMove };
}
