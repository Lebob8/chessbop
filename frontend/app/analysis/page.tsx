import AnalysisView from "@/components/analysis/AnalysisView";
import { Suspense } from "react";

export default function AnalysisPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Analysis</h1>
        <a
          href="/editor"
          className="rounded border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
        >
          Open Board Editor
        </a>
      </div>
      <Suspense fallback={<div className="text-sm text-zinc-400">Loading…</div>}>
        <AnalysisView />
      </Suspense>
    </div>
  );
}
