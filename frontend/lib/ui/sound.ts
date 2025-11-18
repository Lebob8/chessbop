"use client";

export type SoundId = "move" | "capture" | "castle" | "promote" | "check" | "checkmate";

const SOUND_PATHS: Record<SoundId, string> = {
  move: "/sound/move.mp3",
  capture: "/sound/capture.mp3",
  castle: "/sound/castling.mp3",
  promote: "/sound/promote.mp3",
  check: "/sound/check.mp3",
  checkmate: "/sound/checkmate.mp3",
};

const audioCache: Partial<Record<SoundId, HTMLAudioElement>> = {};

export function playSound(id: SoundId): void {
  if (typeof window === "undefined") return;
  try {
    let audio = audioCache[id];
    if (!audio) {
      audio = new Audio(SOUND_PATHS[id]);
      audioCache[id] = audio;
    }
    audio.currentTime = 0;
    void audio.play();
  } catch {
    // Ignore playback errors (e.g., autoplay policies)
  }
}

