import { StockfishWorker } from "./stockfish-worker";
import type { EngineOptions } from "./types";

export type OpponentConfig = {
  /** Toggle UCI_LimitStrength */
  useLimitStrength?: boolean;
  /** Target ELO when limiting strength (600–3000) */
  elo?: number;
  /** Per-move time in milliseconds (default: 300ms) */
  movetimeMs?: number;
};

/**
 * Opponent engine for PvE mode.
 * Uses a dedicated StockfishWorker instance configured for movetime searches
 * with optional UCI_LimitStrength / UCI_Elo.
 */
export class OpponentEngine {
  private worker: StockfishWorker | null = null;
  private ready = false;
  private lastConfigKey: string | null = null;
  private analyzing = false;
  private disposed = false;
  private chess960 = false;

  /**
   * Lazily initialize the underlying Stockfish engine.
   */
  private async ensureInitialized(options: EngineOptions = {}): Promise<void> {
    if (this.disposed) {
      throw new Error("OpponentEngine disposed");
    }
    if (this.worker && this.ready) {
      return;
    }

    const engine = new StockfishWorker();
    // Use modest defaults; multiPV stays 1 for a single best move
    await engine.initialize({
      threads: options.threads ?? 1,
      hash: options.hash ?? 16,
      multiPV: 1,
    });
    this.worker = engine;
    this.ready = true;
  }

  /**
   * Public initializer for callers that want to warm up the engine
   * ahead of time and track readiness explicitly.
   */
  async initialize(options: EngineOptions = {}): Promise<void> {
    await this.ensureInitialized(options);
  }

  /**
   * Whether the opponent engine has an initialized worker and is not disposed.
   */
  isReady(): boolean {
    return !!this.worker && this.ready && !this.disposed;
  }

  /**
   * Configure UCI options for opponent play.
   * Uses a signature key to avoid redundant configuration calls.
   */
  private async configure(cfg: OpponentConfig): Promise<void> {
    if (!this.worker) return;

    const configKey = `${cfg.useLimitStrength ?? false}-${cfg.elo ?? ""}-${
      this.chess960 ? "960" : "std"
    }`;
    if (this.lastConfigKey === configKey) return;

    const opts: Record<string, string | number | boolean> = {};

    // Variant
    opts.UCI_Chess960 = this.chess960 ? "true" : "false";

    // Strength limiting
    if (cfg.useLimitStrength) {
      opts.UCI_LimitStrength = "true";
      if (typeof cfg.elo === "number" && Number.isFinite(cfg.elo)) {
        const clamped = Math.max(400, Math.min(3000, Math.floor(cfg.elo)));
        opts.UCI_Elo = String(clamped);
      }
    } else {
      // Ensure full strength if not limiting
      opts.UCI_LimitStrength = "false";
    }

    // Opponent engine uses single PV and no pondering
    opts.MultiPV = 1;
    opts.Ponder = "false";

    try {
      await this.worker.setOptions(opts);
      this.lastConfigKey = configKey;
    } catch {
      // Swallow configuration errors; caller can still attempt moves.
    }
  }

  /**
   * Get the opponent's best move for a given position.
   * Returns a UCI move string (e.g. "e2e4") or null on failure.
   */
  async bestMove(fen: string, cfg: OpponentConfig): Promise<string | null> {
    if (this.disposed) return null;
    if (this.analyzing) {
      console.warn("OpponentEngine already analyzing, skipping request");
      return null;
    }

    await this.ensureInitialized();
    if (!this.worker) return null;

    await this.configure(cfg);

    this.analyzing = true;
    try {
      const movetime = Math.max(50, Math.floor(cfg.movetimeMs ?? 300));
      console.log("[OpponentEngine] bestMove start", {
        fen,
        movetime,
        elo: cfg.elo,
        useLimitStrength: cfg.useLimitStrength,
      });
      const result = await this.worker.analyze(fen, { movetime });
      // StockfishWorker returns evaluation with pv as an array of UCI moves.
      const bestMoveUci = result.pv?.[0];
      console.log("[OpponentEngine] bestMove result", {
        bestMoveUci,
        depth: result.depth,
        cp: result.cp,
        mate: result.mate,
      });
      return bestMoveUci ?? null;
    } catch (err) {
      console.error("OpponentEngine.bestMove error:", err);
      return null;
    } finally {
      this.analyzing = false;
    }
  }

  /**
   * Stop any ongoing opponent search.
   */
  stop(): void {
    if (this.disposed) return;
    try {
      this.worker?.stop();
    } catch {
      // ignore
    }
  }

  /**
   * Dispose the opponent engine and underlying worker.
   */
  terminate(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.analyzing = false;
    this.lastConfigKey = null;
    try {
      this.worker?.terminate();
    } catch {
      // ignore
    }
    this.worker = null;
  }

  /**
   * Enable or disable Chess960 (Fischer Random) mode.
   * Also resets the configuration signature so the next configure() call reapplies options.
   */
  setChess960(enabled: boolean): void {
    this.chess960 = !!enabled;
    this.lastConfigKey = null;
  }
}
