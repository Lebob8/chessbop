export type Color = "w" | "b";
export type PieceType = "P" | "N" | "B" | "R" | "Q" | "K";
export type PieceCode = `${Color}${PieceType}`;

export type Square =
  | "a1" | "b1" | "c1" | "d1" | "e1" | "f1" | "g1" | "h1"
  | "a2" | "b2" | "c2" | "d2" | "e2" | "f2" | "g2" | "h2"
  | "a3" | "b3" | "c3" | "d3" | "e3" | "f3" | "g3" | "h3"
  | "a4" | "b4" | "c4" | "d4" | "e4" | "f4" | "g4" | "h4"
  | "a5" | "b5" | "c5" | "d5" | "e5" | "f5" | "g5" | "h5"
  | "a6" | "b6" | "c6" | "d6" | "e6" | "f6" | "g6" | "h6"
  | "a7" | "b7" | "c7" | "d7" | "e7" | "f7" | "g7" | "h7"
  | "a8" | "b8" | "c8" | "d8" | "e8" | "f8" | "g8" | "h8";

export type PiecesMap = Partial<Record<Square, PieceCode>>;

export type EditorOptions = {
  sideToMove: Color;
  castling: { K: boolean; Q: boolean; k: boolean; q: boolean };
  enPassant: Square | null;
};

export type EditorState = {
  pieces: PiecesMap;
  options: EditorOptions;
};

const files = ["a","b","c","d","e","f","g","h"] as const;
const ranks = ["1","2","3","4","5","6","7","8"] as const;

export function allSquares(): Square[] {
  const out: Square[] = [] as Square[];
  for (let r = 0; r < 8; r += 1) {
    for (let f = 0; f < 8; f += 1) {
      out.push(`${files[f]}${r+1}` as Square);
    }
  }
  return out;
}

export function editorStateFromFEN(fen: string): EditorState {
  const parts = fen.trim().split(" ");
  const pieces: PiecesMap = {};
  if (parts.length >= 1) {
    const placement = parts[0];
    const ranksList = placement.split("/");
    // FEN ranks are from 8 to 1
    for (let r = 0; r < 8; r += 1) {
      const rankStr = ranksList[r] ?? "8";
      let fileIdx = 0;
      for (const ch of rankStr) {
        if (/[1-8]/.test(ch)) {
          fileIdx += parseInt(ch, 10);
        } else {
          const file = files[fileIdx];
          const rank = (8 - r).toString();
          const square = `${file}${rank}` as Square;
          const isUpper = ch === ch.toUpperCase();
          const color: Color = isUpper ? "w" : "b";
          const type = ch.toUpperCase() as PieceType;
          pieces[square] = `${color}${type}` as PieceCode;
          fileIdx += 1;
        }
      }
    }
  }
  const sideToMove: Color = parts[1] === "b" ? "b" : "w";
  const castlingStr = parts[2] || "-";
  const castling = {
    K: castlingStr.includes("K"),
    Q: castlingStr.includes("Q"),
    k: castlingStr.includes("k"),
    q: castlingStr.includes("q"),
  };
  const enPassant = (parts[3] && parts[3] !== "-" ? (parts[3] as Square) : null);
  return { pieces, options: { sideToMove, castling, enPassant } };
}

export function startPositionState(): EditorState {
  return editorStateFromFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
}

function pieceToFenSymbol(pc: PieceCode): string {
  const color = pc[0] as Color;
  const type = pc[1] as PieceType;
  const sym = type;
  return color === "w" ? sym : sym.toLowerCase();
}

export function editorStateToFEN(state: EditorState, halfmove: number = 0, fullmove: number = 1): string {
  // Build placement from ranks 8 -> 1
  const ranksOut: string[] = [];
  for (let r = 8; r >= 1; r -= 1) {
    let row = "";
    let empty = 0;
    for (const f of files) {
      const sq = `${f}${r}` as Square;
      const pc = state.pieces[sq];
      if (!pc) {
        empty += 1;
      } else {
        if (empty > 0) {
          row += String(empty);
          empty = 0;
        }
        row += pieceToFenSymbol(pc);
      }
    }
    if (empty > 0) row += String(empty);
    ranksOut.push(row || "8");
  }
  const placement = ranksOut.join("/");

  const side = state.options.sideToMove === "b" ? "b" : "w";
  const c = state.options.castling;
  const castling = `${c.K ? "K" : ""}${c.Q ? "Q" : ""}${c.k ? "k" : ""}${c.q ? "q" : ""}` || "-";
  const ep = state.options.enPassant ?? "-";
  return `${placement} ${side} ${castling} ${ep} ${halfmove} ${fullmove}`;
}
