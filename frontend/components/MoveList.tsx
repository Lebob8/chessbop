"use client";

import { useMemo, useRef, useEffect } from "react";

type Move = { san: string; color: "w" | "b" };

export function MoveList({ 
  moves, 
  onMoveClick, 
  currentIndex 
}: { 
  moves: Move[] | undefined;
  onMoveClick?: (index: number) => void;
  currentIndex?: number;
}) {
  const moveRows = useMemo(() => {
    const list = moves || [];
    const rows: Array<{ no: number; w?: { san: string; idx: number }; b?: { san: string; idx: number } }> = [];
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      const moveIdx = i + 1; // Position index after this move (0 = start, 1 = after first move, etc.)
      if (m.color === "w") {
        rows.push({ no: rows.length + 1, w: { san: m.san, idx: moveIdx } });
      } else {
        if (!rows.length) rows.push({ no: 1, w: { san: "…", idx: 0 }, b: { san: m.san, idx: moveIdx } });
        else rows[rows.length - 1].b = { san: m.san, idx: moveIdx };
      }
    }
    return rows;
  }, [moves]);

  const lastPlyIndex = (moves?.length || 0);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [moves?.length]);

  // Ensure the currently selected move is visible when navigating
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof currentIndex !== 'number') return;
    if (currentIndex <= 0) { el.scrollTop = 0; return; }
    try {
      const target = el.querySelector<HTMLElement>(`[data-idx="${currentIndex}"]`);
      if (!target) return;
      const tTop = target.offsetTop;
      const tBottom = tTop + target.offsetHeight;
      const viewTop = el.scrollTop;
      const viewBottom = viewTop + el.clientHeight;
      const pad = 16;
      if (tTop < viewTop) el.scrollTop = Math.max(0, tTop - pad);
      else if (tBottom > viewBottom) el.scrollTop = Math.max(0, tBottom - el.clientHeight + pad);
    } catch {}
  }, [currentIndex]);

  return (
    <div
      ref={ref}
      style={{  overflowY: "auto", border: "1px solid #333", borderRadius: 6, height: '100%', minHeight: 0 }}
      data-testid="move-list"
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
        }}
      >
        <div>#</div>
        <div>White</div>
        <div>Black</div>
      </div>
      <div>
        {moveRows.map((r, i) => {
          const isLastRow = i === moveRows.length - 1;
          const lastIsWhite = moves && moves[moves.length - 1]?.color === "w";
          const isLastWhite = isLastRow && lastIsWhite && currentIndex === lastPlyIndex;
          const isLastBlack = isLastRow && !lastIsWhite && currentIndex === lastPlyIndex;
          return (
            <div
              key={i}
              style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr", padding: "6px 8px", gap: 8 }}
            >
              <div style={{ opacity: 1 }}>{r.no}.</div>
              <div 
                data-idx={r.w?.idx}
                style={{ 
                  background: currentIndex === r.w?.idx ? "#2a3b2a" : isLastWhite ? "#2a3b2a" : undefined, 
                  borderRadius: 4, 
                  padding: "0 4px",
                  cursor: onMoveClick && r.w ? 'pointer' : undefined,
                  transition: 'background 0.15s'
                }}
                onClick={() => onMoveClick && r.w && onMoveClick(r.w.idx)}
                onMouseEnter={(e) => onMoveClick && r.w && (e.currentTarget.style.background = '#3a4b3a')}
                onMouseLeave={(e) => onMoveClick && r.w && (e.currentTarget.style.background = currentIndex === r.w?.idx ? '#2a3b2a' : '')}
              >
                {r.w?.san || ""}
              </div>
              <div 
                data-idx={r.b?.idx}
                style={{ 
                  background: currentIndex === r.b?.idx ? "#3b2a2a" : isLastBlack ? "#3b2a2a" : undefined, 
                  borderRadius: 4, 
                  padding: "0 4px",
                  cursor: onMoveClick && r.b ? 'pointer' : undefined,
                  transition: 'background 0.15s'
                }}
                onClick={() => onMoveClick && r.b && onMoveClick(r.b.idx)}
                onMouseEnter={(e) => onMoveClick && r.b && (e.currentTarget.style.background = '#4b3a3a')}
                onMouseLeave={(e) => onMoveClick && r.b && (e.currentTarget.style.background = currentIndex === r.b?.idx ? '#3b2a2a' : '')}
              >
                {r.b?.san || ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

