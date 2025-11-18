"use client";

export type UIPrefs = {
  soundEnabled: boolean;
  soundMove: boolean;
  soundCapture: boolean;
  soundCheck: boolean;
  soundGameEnd: boolean;
};

const defaultPrefs: UIPrefs = {
  soundEnabled: true,
  soundMove: true,
  soundCapture: true,
  soundCheck: true,
  soundGameEnd: true,
};

export function useUIPrefs() {
  return { prefs: defaultPrefs };
}

