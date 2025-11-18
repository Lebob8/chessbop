import type { EngineEvaluation, EngineOptions } from "./types";

/**
 * Queue for async message handling (single consumer)
 */
class Queue<T> {
  private getter: ((value: T) => void) | null = null;
  private list: T[] = [];

  async get(): Promise<T> {
    if (this.list.length > 0) {
      return this.list.shift()!;
    }
    return new Promise((resolve) => {
      this.getter = resolve;
    });
  }

  put(value: T): void {
    if (this.getter) {
      this.getter(value);
      this.getter = null;
      return;
    }
    this.list.push(value);
  }
}

/**
 * Stockfish engine interface (from stockfish.js)
 */
interface StockfishEngine {
  postMessage(command: string): void;
  addMessageListener(callback: (line: string) => void): void;
  removeMessageListener(callback: (line: string) => void): void;
  terminate?(): void;
}

/**
 * Wrapper around Stockfish WASM engine with UCI protocol
 */
export class StockfishWorker {
  private engine: StockfishEngine | null = null;
  private queue = new Queue<string>();
  private messageListener: ((line: string) => void) | null = null;
  private infoCallback: ((evaluation: EngineEvaluation) => void) | null = null;
  private currentFen: string = "";
  private lastInfoAt = 0;

  /**
   * Initialize the Stockfish engine
   */
  async initialize(options: EngineOptions = {}): Promise<void> {
    // Load Stockfish from global (provided by stockfish.js script)
    if (
      typeof window === "undefined" ||
      !(window as unknown as { Stockfish?: () => Promise<StockfishEngine> })
        .Stockfish
    ) {
      throw new Error(
        "Stockfish not loaded. Make sure stockfish.js is included."
      );
    }

    const Stockfish = (
      window as unknown as { Stockfish: () => Promise<StockfishEngine> }
    ).Stockfish;
    this.engine = await Stockfish();

    // Set up message listener
    this.messageListener = (line: string) => {
      this.queue.put(line);

      // Parse info lines for live updates with basic throttling
      if (line.startsWith("info") && this.infoCallback) {
        const now = Date.now();
        const shouldEmit = now - this.lastInfoAt >= 100;
        if (!shouldEmit) {
          return;
        }
        this.lastInfoAt = now;

        const evaluation = this.parseInfoLine(line, this.currentFen);
        if (evaluation) {
          this.infoCallback(evaluation);
        }
      }
    };

    if (this.engine) {
      this.engine.addMessageListener(this.messageListener);
    }

    // Initialize UCI protocol
    this.send("uci");
    await this.receiveUntil((line) => line === "uciok");

    // Set engine options
    const {
      threads = 1,
      hash = 16,
      multiPV = 1,
    } = options;

    this.send(`setoption name Threads value ${threads}`);
    this.send(`setoption name Hash value ${hash}`);
    this.send(`setoption name MultiPV value ${multiPV}`);

    this.send("isready");
    await this.receiveUntil((line) => line === "readyok");
  }

  /**
   * Start a new game
   */
  async newGame(): Promise<void> {
    this.send("ucinewgame");
    this.send("isready");
    await this.receiveUntil((line) => line === "readyok");
  }

  /**
   * Set a single UCI option and wait for the engine to be ready.
   * Example: setOption("UCI_LimitStrength", true)
   */
  async setOption(
    name: string,
    value: string | number | boolean
  ): Promise<void> {
    const valStr = String(value);
    this.send(`setoption name ${name} value ${valStr}`);
    this.send("isready");
    await this.receiveUntil((line) => line === "readyok");
  }

  /**
   * Set multiple UCI options in a batch, then wait for readiness once.
   */
  async setOptions(
    options: Record<string, string | number | boolean>
  ): Promise<void> {
    for (const [name, value] of Object.entries(options)) {
      const valStr = String(value);
      this.send(`setoption name ${name} value ${valStr}`);
    }
    this.send("isready");
    await this.receiveUntil((line) => line === "readyok");
  }

  /**
   * Analyze a position
   */
  async analyze(
    fen: string,
    options: EngineOptions = {},
    onInfo?: (evaluation: EngineEvaluation) => void
  ): Promise<EngineEvaluation> {
    // Stop any previous search before starting a new one
    this.stop();

    this.infoCallback = onInfo || null;
    this.currentFen = fen;

    // Set position
    this.send(`position fen ${fen}`);
    this.send("isready");
    await this.receiveUntil((line) => line === "readyok");

    // Start search
      const { depth, movetime } = options;
    let goCommand = "go";
    if (depth) {
      goCommand += ` depth ${depth}`;
    } else if (movetime) {
      goCommand += ` movetime ${movetime}`;
    } else {
      // Default: depth 15
      goCommand += " depth 15";
    }

    this.send(goCommand);
    const lines = await this.receiveUntil((line) => line.startsWith("bestmove"));

    // Parse the best evaluation from info lines
    let bestEval: EngineEvaluation | null = null;
    for (const line of lines) {
      if (line.startsWith("info")) {
        const evaluation = this.parseInfoLine(line, fen);
        if (evaluation && evaluation.pv.length > 0) {
          bestEval = evaluation;
        }
      }
    }

    this.infoCallback = null;

    if (!bestEval) {
      throw new Error("No evaluation received from engine");
    }

    return bestEval;
  }

  /**
   * Stop current analysis
   */
  stop(): void {
    if (this.engine) {
      this.send("stop");
    }
  }

  /**
   * Terminate the engine
   */
  terminate(): void {
    if (this.engine) {
      if (this.messageListener) {
        this.engine.removeMessageListener(this.messageListener);
      }
      if (this.engine.terminate) {
        this.engine.terminate();
      }
      this.engine = null;
    }
  }

  /**
   * Send UCI command to engine
   */
  private send(command: string): void {
    if (!this.engine) {
      throw new Error("Engine not initialized");
    }
    this.engine.postMessage(command);
  }

  /**
   * Receive a single line from engine
   */
  private async receive(): Promise<string> {
    return this.queue.get();
  }

  /**
   * Receive lines until predicate returns true
   */
  private async receiveUntil(
    predicate: (line: string) => boolean
  ): Promise<string[]> {
    const lines: string[] = [];
    while (true) {
      const line = await this.receive();
      lines.push(line);
      if (predicate(line)) {
        break;
      }
    }
    return lines;
  }

  /**
   * Parse UCI info line into evaluation object
   * Example: info depth 20 seldepth 25 multipv 1 score cp 25 nodes 123456 nps 50000 time 2468 pv e2e4 e7e5
   * Note: Stockfish reports scores from side-to-move perspective, we convert to white's perspective
   */
  private parseInfoLine(line: string, fen: string = ""): EngineEvaluation | null {
    const tokens = line.split(" ");

    // Must have depth and score
    const depthIdx = tokens.indexOf("depth");
    const scoreIdx = tokens.indexOf("score");
    if (depthIdx === -1 || scoreIdx === -1) {
      return null;
    }

    const depth = parseInt(tokens[depthIdx + 1], 10);
    const seldepthIdx = tokens.indexOf("seldepth");
    const seldepth = seldepthIdx !== -1 ? parseInt(tokens[seldepthIdx + 1], 10) : undefined;

    // Parse score (cp or mate)
    const scoreType = tokens[scoreIdx + 1]; // "cp" or "mate"
    let scoreValue = parseInt(tokens[scoreIdx + 2], 10);
    
    // Stockfish reports from side-to-move perspective, convert to white's perspective
    // FEN format: "... w ..." (white) or "... b ..." (black)
    const isBlackToMove = fen.split(" ")[1] === "b";
    if (isBlackToMove) {
      scoreValue = -scoreValue; // Flip sign for black's perspective
    }
    
    const cp = scoreType === "cp" ? scoreValue : undefined;
    const mate = scoreType === "mate" ? scoreValue : undefined;

    // Parse other fields
    const nodesIdx = tokens.indexOf("nodes");
    const nodes = nodesIdx !== -1 ? parseInt(tokens[nodesIdx + 1], 10) : 0;

    const npsIdx = tokens.indexOf("nps");
    const nps = npsIdx !== -1 ? parseInt(tokens[npsIdx + 1], 10) : 0;

    const timeIdx = tokens.indexOf("time");
    const time = timeIdx !== -1 ? parseInt(tokens[timeIdx + 1], 10) : 0;

    const multipvIdx = tokens.indexOf("multipv");
    const multipv = multipvIdx !== -1 ? parseInt(tokens[multipvIdx + 1], 10) : undefined;

    // Parse principal variation
    const pvIdx = tokens.indexOf("pv");
    const pv = pvIdx !== -1 ? tokens.slice(pvIdx + 1) : [];

    return {
      cp,
      mate,
      depth,
      seldepth,
      nodes,
      nps,
      time,
      pv,
      multipv,
    };
  }
}
