"use client";

import { useMemo, useRef, useEffect } from "react";
import type { GameNode } from "@/core/chess";

type MoveRowItem = {
  type: "move" | "variation-start" | "variation-end";
  node?: GameNode;
  moveNumber?: number;
  isWhite?: boolean;
  depth: number; // indentation level for variations
  variationIndex?: number; // which variation among siblings
};

export function MoveListTree({
  rootNode,
  currentNode,
  onNodeClick,
  treeVersion,
}: {
  rootNode: GameNode;
  currentNode: GameNode;
  onNodeClick?: (nodeId: string) => void;
  treeVersion?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  // Build flattened move list with variation markers
  // Note: We use currentNode.id as dependency to force re-computation when tree changes
  const moveItems = useMemo(() => {
    const items: MoveRowItem[] = [];
    
    function traverse(node: GameNode, depth: number = 0) {
      // Add current move (skip root node which has no move)
      if (node.move) {
        items.push({
          type: "move",
          node,
          moveNumber: node.moveNumber,
          isWhite: node.move.color === "w",
          depth,
        });
      }

      // Process children inline (main line first, then variations)
      if (node.children.length > 0) {
        // Main line (first child) - continue at same depth
        traverse(node.children[0], depth);

        // Variations (remaining children) - show inline with increased depth
        for (let i = 1; i < node.children.length; i++) {
          items.push({ 
            type: "variation-start", 
            depth: depth + 1,
            variationIndex: i,
          });
          traverse(node.children[i], depth + 1);
          items.push({ 
            type: "variation-end", 
            depth: depth + 1,
          });
        }
      }
    }

    traverse(rootNode);
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootNode, treeVersion]);

  // Group moves into rows (white + black pairs)
  const rows = useMemo(() => {
    type Row = {
      moveNumber: number;
      white?: MoveRowItem;
      black?: MoveRowItem;
      depth: number;
      markers?: { before?: MoveRowItem; after?: MoveRowItem };
    };
    
    const result: Row[] = [];
    let currentRow: Row | null = null;

    for (const item of moveItems) {
      if (item.type === "variation-start" || item.type === "variation-end") {
        // Variation markers - create separate row
        if (currentRow) {
          result.push(currentRow);
          currentRow = null;
        }
        result.push({
          moveNumber: 0,
          depth: item.depth,
          markers: item.type === "variation-start" ? { before: item } : { after: item },
        });
        continue;
      }

      if (item.isWhite) {
        // Start new row for white move
        if (currentRow) {
          result.push(currentRow);
        }
        currentRow = {
          moveNumber: item.moveNumber!,
          white: item,
          depth: item.depth,
        };
      } else {
        // Add black move to current row
        if (currentRow) {
          currentRow.black = item;
          result.push(currentRow);
          currentRow = null;
        } else {
          // Black move without white (e.g., variation starting with black)
          result.push({
            moveNumber: item.moveNumber!,
            black: item,
            depth: item.depth,
          });
        }
      }
    }

    // Push last row if exists
    if (currentRow) {
      result.push(currentRow);
    }

    return result;
  }, [moveItems]);

  // Auto-scroll to current move
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    try {
      const target = el.querySelector<HTMLElement>(`[data-node-id="${currentNode.id}"]`);
      if (!target) return;
      
      const tTop = target.offsetTop;
      const tBottom = tTop + target.offsetHeight;
      const viewTop = el.scrollTop;
      const viewBottom = viewTop + el.clientHeight;
      const pad = 16;
      
      if (tTop < viewTop) {
        el.scrollTop = Math.max(0, tTop - pad);
      } else if (tBottom > viewBottom) {
        el.scrollTop = Math.max(0, tBottom - el.clientHeight + pad);
      }
    } catch {}
  }, [currentNode.id]);

  const renderMove = (item: MoveRowItem | undefined, isCurrent: boolean) => {
    if (!item || !item.node) return null;

    return (
      <div
        data-node-id={item.node.id}
        style={{
          background: isCurrent ? "#2a3b2a" : undefined,
          borderRadius: 4,
          padding: "2px 6px",
          cursor: onNodeClick ? "pointer" : undefined,
          transition: "background 0.15s",
          fontSize: "13px",
        }}
        onClick={() => onNodeClick && onNodeClick(item.node!.id)}
        onMouseEnter={(e) => {
          if (onNodeClick && !isCurrent) {
            e.currentTarget.style.background = "#3a4b3a";
          }
        }}
        onMouseLeave={(e) => {
          if (onNodeClick && !isCurrent) {
            e.currentTarget.style.background = "";
          }
        }}
      >
        {item.node.move?.san || ""}
      </div>
    );
  };

  return (
    <div
      ref={ref}
      style={{
        overflowY: "auto",
        border: "1px solid #333",
        borderRadius: 6,
        height: "100%",
        minHeight: 0,
      }}
      data-testid="move-list-tree"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "40px 1fr 1fr",
          padding: "6px 8px",
          gap: 8,
          background: "#111",
          color: "#ccc",
          position: "sticky",
          top: 0,
          fontSize: "12px",
        }}
      >
        <div>#</div>
        <div>White</div>
        <div>Black</div>
      </div>

      <div>
        {rows.map((row, i) => {
          const indentPx = row.depth * 20;

          // Variation markers
          if (row.markers) {
            return (
              <div
                key={`marker-${i}`}
                style={{
                  paddingLeft: `${indentPx + 8}px`,
                  padding: "2px 8px",
                  fontSize: "11px",
                  color: "#888",
                  fontStyle: "italic",
                }}
              >
                {row.markers.before && "("}
                {row.markers.after && ")"}
              </div>
            );
          }

          const whiteCurrent = row.white?.node?.id === currentNode.id;
          const blackCurrent = row.black?.node?.id === currentNode.id;

          return (
            <div
              key={`row-${i}`}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 1fr",
                padding: "4px 8px",
                gap: 8,
                paddingLeft: `${indentPx + 8}px`,
              }}
            >
              <div style={{ opacity: 0.7, fontSize: "12px" }}>
                {row.moveNumber > 0 ? `${row.moveNumber}.` : ""}
              </div>
              <div>{renderMove(row.white, whiteCurrent)}</div>
              <div>{renderMove(row.black, blackCurrent)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
