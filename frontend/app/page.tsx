import ChessBoard from "@/components/ChessBoard";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center gap-8 px-4 py-8">
      <ChessBoard />
    </div>
  );
}
