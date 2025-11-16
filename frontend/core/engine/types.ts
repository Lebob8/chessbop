/**
 * Engine evaluation result
 */
export interface EngineEvaluation {
  /** Evaluation in centipawns (positive = white advantage) */
  cp?: number;
  /** Mate in N moves (positive = white mates, negative = black mates) */
  mate?: number;
  /** Search depth reached */
  depth: number;
  /** Selective search depth */
  seldepth?: number;
  /** Nodes searched */
  nodes: number;
  /** Nodes per second */
  nps: number;
  /** Time spent in milliseconds */
  time: number;
  /** Principal variation (best line) */
  pv: string[];
  /** Multi-PV number (for multiple lines) */
  multipv?: number;
}

/**
 * Engine analysis options
 */
export interface EngineOptions {
  /** Search depth (e.g., 15, 20) */
  depth?: number;
  /** Time limit in milliseconds */
  movetime?: number;
  /** Number of principal variations to calculate */
  multiPV?: number;
  /** Number of threads (default: 1) */
  threads?: number;
  /** Hash table size in MB (default: 16) */
  hash?: number;
}

/**
 * Engine state
 */
export type EngineState = "idle" | "loading" | "ready" | "analyzing" | "error";

/**
 * Engine analysis result
 */
export interface EngineAnalysis {
  /** Current evaluation */
  evaluation: EngineEvaluation | null;
  /** All lines from multiPV analysis */
  lines: EngineEvaluation[];
  /** Engine state */
  state: EngineState;
  /** Error message if state is 'error' */
  error?: string;
}
