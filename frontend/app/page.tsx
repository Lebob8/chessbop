export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <h2 className="mb-6 text-4xl font-bold tracking-tight">
          Welcome to ChessBop
        </h2>
        <p className="mb-8 text-lg text-zinc-400">
          An open-source chess analysis board powered by Stockfish WASM. Analyze
          games, explore variations, and improve your chess.
        </p>
      </div>
    </div>
  );
}
