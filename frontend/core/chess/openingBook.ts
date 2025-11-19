import openingChildrenByEpdJson from "@/data/openingChildrenByEpd.json";

const openingChildrenByEpd = openingChildrenByEpdJson as Record<string, string[]>;

export function getBookMovesByEpd(epd: string): string[] {
  return openingChildrenByEpd[epd] ?? [];
}

