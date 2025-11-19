import { fenToEpd } from "./fen";
import { findOpeningByEpd, type OpeningEntry } from "./openings";
import type { GameNode } from "./types";

export function classifyOpeningFromNode(node: GameNode): OpeningEntry | null {
  let current: GameNode | null = node;
  while (current) {
    const epd = fenToEpd(current.fen);
    const opening = findOpeningByEpd(epd);
    if (opening) return opening;
    current = current.parent;
  }
  return null;
}

