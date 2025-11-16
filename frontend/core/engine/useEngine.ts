"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StockfishWorker } from "./stockfish-worker";
import type {
  EngineAnalysis,
  EngineEvaluation,
  EngineOptions,
  EngineState,
} from "./types";

interface UseEngineOptions {
  /** Auto-start engine on mount */
  autoStart?: boolean;
  /** Default engine options */
  defaultOptions?: EngineOptions;
}

interface UseEngineReturn {
  /** Current analysis result */
  analysis: EngineAnalysis;
  /** Start the engine */
  start: () => Promise<void>;
  /** Stop the engine */
  stop: () => void;
  /** Analyze a position */
  analyze: (fen: string, options?: EngineOptions) => Promise<void>;
  /** Update engine options */
  setOptions: (options: EngineOptions) => Promise<void>;
  /** Is engine ready */
  isReady: boolean;
  /** Is engine analyzing */
  isAnalyzing: boolean;
}

/**
 * React hook for managing Stockfish engine analysis
 */
export function useEngine(options: UseEngineOptions = {}): UseEngineReturn {
  const { autoStart = false, defaultOptions = {} } = options;

  const engineRef = useRef<StockfishWorker | null>(null);
  const [state, setState] = useState<EngineState>("idle");
  const [evaluation, setEvaluation] = useState<EngineEvaluation | null>(null);
  const [lines, setLines] = useState<EngineEvaluation[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const currentOptionsRef = useRef<EngineOptions>(defaultOptions);
  // Refs for throttling live evaluation updates
  const lastUpdateRef = useRef<number>(0);
  const evaluationRef = useRef<EngineEvaluation | null>(null);
  // Track last analyzed position to prevent duplicate analysis
  const lastAnalyzedRef = useRef<{fen: string, depth: number} | null>(null);

  /**
   * Start/initialize the engine
   */
  const start = useCallback(async () => {
    if (engineRef.current) {
      return; // Already started
    }

    setState("loading");
    setError(undefined);

    try {
      const worker = new StockfishWorker();
      await worker.initialize(currentOptionsRef.current);
      engineRef.current = worker;
      setState("ready");
      // Clear last analyzed position when engine starts fresh
      lastAnalyzedRef.current = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setState("error");
      console.error("Failed to initialize engine:", err);
    }
  }, []);

  /**
   * Stop the engine
   */
  const stop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current.terminate();
      engineRef.current = null;
    }
    setState("idle");
    setEvaluation(null);
    setLines([]);
    // Clear last analyzed position so next analysis starts fresh
    lastAnalyzedRef.current = null;
  }, []);

  /**
   * Analyze a position
   */
  const analyze = useCallback(
    async (fen: string, analyzeOptions?: EngineOptions) => {
      const engine = engineRef.current;
      if (!engine) {
        console.warn("Engine not started");
        return;
      }

      const opts = { ...currentOptionsRef.current, ...analyzeOptions };
      const depth = opts.depth ?? 15;
      
      // Guard: Don't re-analyze the same position at same depth
      const lastAnalyzed = lastAnalyzedRef.current;
      if (lastAnalyzed && lastAnalyzed.fen === fen && lastAnalyzed.depth === depth) {
        console.log("Skipping duplicate analysis:", fen, "depth:", depth);
        return;
      }
      
      console.log("Starting analysis:", fen, "depth:", depth);
      lastAnalyzedRef.current = { fen, depth };

      setState("analyzing");
      setError(undefined);

      try {
        // Stop any previous search before starting a new one to avoid overlapping info streams
        engine.stop();

        const result = await engine.analyze(fen, opts, (liveEval) => {
          const now = performance.now();
          const currentDepth = evaluationRef.current?.depth ?? 0;
          const shouldUpdate =
            // Always update if we reached a new depth
            (liveEval.depth > currentDepth) ||
            // Or if sufficient time elapsed since last UI commit
            (now - lastUpdateRef.current > 300);
          if (shouldUpdate) {
            lastUpdateRef.current = now;
            evaluationRef.current = liveEval;
            setEvaluation(liveEval);
          }
        });
        // Final result (bestmove) — commit unthrottled
        evaluationRef.current = result;
        setEvaluation(result);
        setLines([result]); // For now, single line (multiPV support can be added later)
        setState("ready");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setState("error");
        console.error("Analysis failed:", err);
      }
    },
    [] // No dependencies - all state accessed via refs
  );

  /**
   * Update engine options
   */
  const setOptions = useCallback(
    async (newOptions: EngineOptions) => {
      currentOptionsRef.current = { ...currentOptionsRef.current, ...newOptions };

      // If engine is running, reinitialize with new options
      if (engineRef.current && state !== "idle") {
        await stop();
        await start();
      }
    },
    [state, stop, start]
  );

  /**
   * Auto-start on mount if requested
   */
  useEffect(() => {
    if (autoStart) {
      start();
    }

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.terminate();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount

  const analysis: EngineAnalysis = {
    evaluation,
    lines,
    state,
    error,
  };

  return {
    analysis,
    start,
    stop,
    analyze,
    setOptions,
    isReady: state === "ready",
    isAnalyzing: state === "analyzing",
  };
}
