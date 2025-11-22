(function () {
  /**
   * Known engine flavors and their worker script URLs.
   * Paths are served from Next.js public/ as `/lib/stockfish/...`.
   */
  var FLAVORS = {
    // Full NNUE, multi-threaded (large, strongest, requires SAB + COOP/COEP)
    "full-mt": "/lib/stockfish/stockfish-17.1-8e4d048.js",
    // Full NNUE, single-threaded (large, no threads)
    "full-st": "/lib/stockfish/stockfish-17.1-single-a496a04.js",
    // Lite NNUE, multi-threaded (smaller, good desktop default)
    "lite-mt": "/lib/stockfish/stockfish-17.1-lite-51f59da.js",
    // Lite NNUE, single-threaded (smaller, recommended mobile default)
    "lite-st": "/lib/stockfish/stockfish-17.1-lite-single-03e3232.js",
    // ASM fallback (very slow, JS only; not hooked up by default)
    "asm": "/lib/stockfish/stockfish-17.1-asm-341ff22.js"
  };

  /**
   * Minimal wrapper to adapt a Web Worker running Stockfish.js
   * into the StockfishEngine interface expected by StockfishWorker.
   */
  function createEngineFromWorker(workerUrl) {
    return new Promise(function (resolve, reject) {
      try {
        var worker = new Worker(workerUrl);
        var listeners = new Set();

        worker.addEventListener("message", function (event) {
          var data = event.data;
          if (typeof data !== "string") return;
          listeners.forEach(function (cb) {
            try {
              cb(data);
            } catch (err) {
              // Ignore listener errors to avoid breaking engine stream
              console.error("Stockfish listener error:", err);
            }
          });
        });

        var engine = {
          postMessage: function (command) {
            worker.postMessage(command);
          },
          addMessageListener: function (cb) {
            listeners.add(cb);
          },
          removeMessageListener: function (cb) {
            listeners.delete(cb);
          },
          terminate: function () {
            try {
              listeners.clear();
              worker.terminate();
            } catch {
              // ignore
            }
          }
        };

        resolve(engine);
      } catch (err) {
        reject(err);
      }
    });
  }

  function getConfig() {
    var cfg = window.CHESSBOP_STOCKFISH_CONFIG;
    if (!cfg) {
      cfg = {};
      window.CHESSBOP_STOCKFISH_CONFIG = cfg;
    }
    return cfg;
  }

  function pickFlavor(isMobile) {
    var cfg = getConfig();
    var key = isMobile ? cfg.mobileFlavor : cfg.desktopFlavor;
    var fallback = isMobile ? "lite-st" : "lite-mt";
    var flavorKey = FLAVORS[key] ? key : fallback;
    return FLAVORS[flavorKey];
  }

  // Desktop / threaded-capable entry point used by StockfishWorker
  window.Stockfish = function () {
    var url = pickFlavor(false);
    return createEngineFromWorker(url);
  };

  // Mobile / non-threaded fallback entry point used by StockfishWorker
  window.StockfishMobile = function () {
    var url = pickFlavor(true);
    return createEngineFromWorker(url);
  };
})();

