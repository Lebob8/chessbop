export function fenToEpd(fen: string): string {
  const parts = fen.trim().split(" ");
  if (parts.length < 4) return fen.trim();
  return parts.slice(0, 4).join(" ");
}

// (No additional FEN sanitization helpers in the original version)
