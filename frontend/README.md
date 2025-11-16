# ChessBop Frontend

Chess analysis board powered by Stockfish WASM.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Format code
npm run format
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
frontend/
├── app/              # Next.js App Router pages
│   ├── layout.tsx    # Root layout with header
│   ├── page.tsx      # Homepage
│   └── globals.css   # Global styles and Tailwind
├── components/       # Reusable UI components (TBD)
├── features/         # Feature-specific modules (TBD)
├── core/            # Core chess logic and engine (TBD)
└── public/          # Static assets
```

## 🛠 Tech Stack

- **Next.js 16** (App Router)
- **React 19** + TypeScript
- **Tailwind CSS v4** (with PostCSS plugin)
- **Geist Font** (via next/font)
- **ESLint** + **Prettier**

## 📋 Current Status

✅ **Phase 0 Complete** — Project skeleton with dark theme and basic layout

**Next Steps:**

- Phase 1: Chessground board integration
- Phase 2: Analysis page layout
- Phase 3: Stockfish WASM engine

See `extras/Project_roadmap.md` for the complete development plan.
