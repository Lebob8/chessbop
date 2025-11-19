
export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center gap-8 px-4 py-8">
      <h1 className="text-4xl font-bold">Welcome to ChessBop</h1>
      <div className="flex items-center gap-3">
        <a
          href="/analysis"
          className="rounded bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition"
        >
          Go to Analysis
        </a>
        <a
          href="/editor"
          className="rounded border border-white/10 bg-zinc-900 px-4 py-2 text-zinc-200 font-semibold hover:bg-zinc-800 transition"
        >
          Open Board Editor
        </a>
      </div>
    </div>
  );
}
