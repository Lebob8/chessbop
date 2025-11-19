/*
  Build script: Convert lichess chess-openings TSV to compact JSON map by EPD.
  Safe when dataset is missing: writes an empty JSON object so builds don't fail.
*/

const fs = require('fs');
const path = require('path');
let Chess;
try {
  Chess = require('chess.js').Chess;
} catch {
  try {
    Chess = require('chess.js');
  } catch {
    Chess = null;
  }
}

const FRONTEND_DIR = path.resolve(__dirname, '..');
const CANDIDATE_DATA_DIRS = [
  path.resolve(FRONTEND_DIR, '../data/openings'),
  path.resolve(FRONTEND_DIR, 'data/openings'),
];
const OUTPUT_JSON = path.resolve(FRONTEND_DIR, 'data/openingsByEpd.json');
const OUTPUT_CHILDREN_JSON = path.resolve(FRONTEND_DIR, 'data/openingChildrenByEpd.json');

function ensureDir(p) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
}

function findDataDir() {
  for (const d of CANDIDATE_DATA_DIRS) {
    if (fs.existsSync(d) && fs.statSync(d).isDirectory()) return d;
  }
  return null;
}

function parseTsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  // Detect header
  const header = lines[0].split('\t');
  let startIdx = 0;
  let idx = { eco: 0, name: 1, pgn: 2, uci: -1, epd: -1 };
  const headerLower = header.map((h) => h.trim().toLowerCase());
  if (headerLower.includes('eco')) {
    startIdx = 1; // there's a header row
    idx.eco = headerLower.indexOf('eco');
    idx.name = headerLower.indexOf('name');
    idx.pgn = headerLower.indexOf('pgn');
    idx.uci = headerLower.indexOf('uci'); // may be -1
    idx.epd = headerLower.indexOf('epd'); // may be -1
  }

  const entries = [];
  for (let i = startIdx; i < lines.length; i += 1) {
    const cols = lines[i].split('\t');
    if (cols.length < 3) continue;
    const eco = idx.eco >= 0 && cols[idx.eco] ? String(cols[idx.eco]).trim() : '';
    const name = idx.name >= 0 && cols[idx.name] ? String(cols[idx.name]).trim() : '';
    const pgn = idx.pgn >= 0 && cols[idx.pgn] ? String(cols[idx.pgn]).trim() : '';
    const uci = idx.uci >= 0 && cols[idx.uci] ? String(cols[idx.uci]).trim() : '';
    let epd = idx.epd >= 0 && cols[idx.epd] ? String(cols[idx.epd]).trim() : '';
    if (!epd && pgn && Chess) {
      try {
        const chess = new Chess();
        if (typeof chess.loadPgn === 'function') {
          chess.loadPgn(pgn);
          epd = fenToEpd(chess.fen());
        }
      } catch {}
    }
    if (!epd) continue;
    entries.push({ eco, name, pgn, uci, epd });
  }
  return entries;
}

function build() {
  const dataDir = findDataDir();
  const openingsByEpd = {};
  const childrenMap = {}; // EPD -> Set of next UCI moves

  if (dataDir) {
    const files = ['a.tsv', 'b.tsv', 'c.tsv', 'd.tsv', 'e.tsv']
      .map((f) => path.join(dataDir, f))
      .filter((p) => fs.existsSync(p));

    for (const file of files) {
      try {
        const raw = fs.readFileSync(file, 'utf8');
        const rows = parseTsv(raw);
        for (const row of rows) {
          if (!openingsByEpd[row.epd]) {
            openingsByEpd[row.epd] = {
              eco: row.eco,
              name: row.name,
              epd: row.epd,
              pgn: row.pgn,
            };
          }
          if (Chess && row.pgn) {
            try {
              const chess = new Chess();
              chess.reset();
              if (typeof chess.loadPgn === 'function') {
                chess.loadPgn(row.pgn);
                const moves = chess.history({ verbose: true });
                const c2 = new Chess();
                for (const mv of moves) {
                  const epd = fenToEpd(c2.fen());
                  const uci = `${mv.from}${mv.to}${mv.promotion ? mv.promotion : ''}`;
                  if (!childrenMap[epd]) childrenMap[epd] = new Set();
                  childrenMap[epd].add(uci);
                  c2.move({ from: mv.from, to: mv.to, promotion: mv.promotion });
                }
              }
            } catch {}
          }
        }
        // continue to next file
      } catch {
        // Ignore file-level errors to keep build robust
      }
    }
  }

  ensureDir(OUTPUT_JSON);
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(openingsByEpd, null, 2), 'utf8');
  // Convert children sets to arrays
  const childrenOut = {};
  for (const [k, set] of Object.entries(childrenMap)) {
    childrenOut[k] = Array.from(set);
  }
  ensureDir(OUTPUT_CHILDREN_JSON);
  fs.writeFileSync(OUTPUT_CHILDREN_JSON, JSON.stringify(childrenOut, null, 2), 'utf8');
  console.log(`[build-openings] Wrote ${Object.keys(openingsByEpd).length} openings to ${OUTPUT_JSON}`);
  console.log(`[build-openings] Wrote ${Object.keys(childrenOut).length} book roots to ${OUTPUT_CHILDREN_JSON}`);
}

function fenToEpd(fen) {
  if (typeof fen !== 'string') return '';
  const parts = fen.trim().split(' ');
  if (parts.length < 4) return fen.trim();
  return parts.slice(0, 4).join(' ');
}

try {
  build();
} catch (err) {
  try {
    ensureDir(OUTPUT_JSON);
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify({}, null, 2), 'utf8');
  } catch {}
  console.error('[build-openings] Failed:', err);
  process.exit(0);
}
