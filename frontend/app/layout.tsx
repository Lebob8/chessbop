import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChessBop — Chess Analysis",
  description: "Open-source chess analysis board powered by Stockfish",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script src="/lib/stockfish.js" async />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} bg-black text-zinc-100 antialiased`}>
        <header className="border-b border-white/10 bg-zinc-950/50">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <Link href="/" className="text-2xl font-bold transition-colors hover:text-blue-400">
              ChessBop
            </Link>
          </div>
        </header>
        <main className="min-h-[calc(100vh-73px)]">{children}</main>
      </body>
    </html>
  );
}

