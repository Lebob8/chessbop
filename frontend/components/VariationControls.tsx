"use client";

import type { GameTree } from "@/core/chess";

export function VariationControls({
  gameTree,
  onTreeChange,
}: {
  gameTree: GameTree;
  onTreeChange: () => void;
}) {
  const current = gameTree.getCurrent();
  const parent = current.parent;
  const variationIndex = gameTree.getCurrentVariationIndex();
  const siblingCount = parent ? parent.children.length : 0;
  const hasVariations = parent && siblingCount > 1;
  
  // Check if any ancestor in the current path is a variation (not first child)
  const isInVariation = () => {
    let node = current;
    while (node.parent) {
      const idx = node.parent.children.indexOf(node);
      if (idx > 0) return true; // This node is a variation (not first child)
      node = node.parent;
    }
    return false;
  };

  const btnClass =
    "rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-700 disabled:hover:bg-zinc-800";

  const handlePromote = () => {
    if (variationIndex > 0 && gameTree.promoteVariation(current.id)) {
      onTreeChange();
    }
  };

  const handleDelete = () => {
    if (variationIndex > 0 && gameTree.deleteVariation(current.id)) {
      onTreeChange();
    }
  };

  const handlePrevVariation = () => {
    if (parent && variationIndex > 0) {
      const prevSibling = parent.children[variationIndex - 1];
      if (prevSibling && gameTree.setCurrentById(prevSibling.id)) {
        onTreeChange();
      }
    }
  };

  const handleNextVariation = () => {
    if (parent && variationIndex < siblingCount - 1) {
      const nextSibling = parent.children[variationIndex + 1];
      if (nextSibling && gameTree.setCurrentById(nextSibling.id)) {
        onTreeChange();
      }
    }
  };

  // Show controls if: 1) current position has variations, OR 2) we're in a variation line
  const showControls = parent && (hasVariations || variationIndex > 0 || isInVariation());
  
  if (!showControls) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-zinc-950/50 p-3">
      <h3 className="text-xs font-semibold text-zinc-400">
        Variation Controls
      </h3>

      {hasVariations && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            Variation {variationIndex + 1} of {siblingCount}
          </span>
          <button
            onClick={handlePrevVariation}
            disabled={variationIndex === 0}
            className={btnClass}
            title="Previous variation (same position)"
          >
            ← Prev
          </button>
          <button
            onClick={handleNextVariation}
            disabled={variationIndex === siblingCount - 1}
            className={btnClass}
            title="Next variation (same position)"
          >
            Next →
          </button>
        </div>
      )}

      {variationIndex > 0 && (
        <div className="flex gap-2">
          <button
            onClick={handlePromote}
            className={btnClass}
            title="Promote this variation to main line"
          >
            ↑ Promote to Main
          </button>
          <button
            onClick={handleDelete}
            className={`${btnClass} border-red-900/50 text-red-400 hover:border-red-800 hover:bg-red-950`}
            title="Delete this variation"
          >
            × Delete Variation
          </button>
        </div>
      )}

      {variationIndex === 0 && hasVariations && (
        <div className="text-xs text-zinc-600">
          This is the main line. Click a variation in the move list to manage it.
        </div>
      )}

      {!hasVariations && variationIndex === 0 && isInVariation() && (
        <div className="text-xs text-zinc-500">
          ℹ️ You are in a variation branch. Navigate back to see variation controls.
        </div>
      )}
    </div>
  );
}
