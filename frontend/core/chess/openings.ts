import openingsByEpdJson from "@/data/openingsByEpd.json";

export type OpeningEntry = {
  eco: string;
  name: string;
  epd: string;
  pgn: string;
};

const openingsByEpd = openingsByEpdJson as Record<string, OpeningEntry>;

export function findOpeningByEpd(epd: string): OpeningEntry | null {
  return openingsByEpd[epd] ?? null;
}

