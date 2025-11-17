/**
 * Represents a single move in chess notation
 */
export interface Move {
  /** Standard Algebraic Notation (e.g., "Nf3", "e4") */
  san: string;
  /** Source square (e.g., "e2") */
  from: string;
  /** Destination square (e.g., "e4") */
  to: string;
  /** Color of the side that made the move */
  color: "w" | "b";
  /** Promotion piece if applicable */
  promotion?: "q" | "r" | "b" | "n";
}

/**
 * A node in the game tree representing a position
 */
export interface GameNode {
  /** Unique identifier for this node */
  id: string;
  /** FEN string of the position after this move */
  fen: string;
  /** The move that led to this position (null for root) */
  move: Move | null;
  /** Parent node (null for root) */
  parent: GameNode | null;
  /** Child variations from this position */
  children: GameNode[];
  /** Optional comment/annotation for this position */
  comment?: string;
  /** Move number (full moves, starts at 1) */
  moveNumber: number;
}
