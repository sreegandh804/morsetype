# morsetype

A keyboard-first Morse code typing trainer modeled on the UX of [monkeytype](https://monkeytype.com). Pick a content type, key in dots and dashes, watch your WPM climb.

Live design language: warm-charcoal background, mustard accents, JetBrains Mono throughout.

## Stack

- **TanStack Start** (React 19 + TanStack Router) on Vite
- **Tailwind CSS v4** with a custom `serika`-inspired palette
- **shadcn/ui** primitives (Radix) for dialogs, inputs, toasts
- **Supabase** for the leaderboard
- **Cloudflare** deployment target via `@cloudflare/vite-plugin` + `wrangler`

## Getting started

### Prerequisites

- **Node.js 20+** (Node 22 recommended)
- **Bun** or **npm** / **pnpm** — the repo ships a `bun.lock`, so Bun is the path of least friction

### 1. Install dependencies

```bash
bun install
# or
npm install
```

### 2. Configure environment

Copy `.env` and set your Supabase credentials (the leaderboard route uses these). Required variables:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

The app will still run without Supabase — only leaderboard submit / fetch will fail.

### 3. Start the dev server

```bash
bun run dev
# or
npm run dev
```

Vite prints a local URL (default `http://localhost:5173`). Open it in a browser.

### Other scripts

| Script | What it does |
| --- | --- |
| `bun run dev` | Start the Vite dev server with HMR |
| `bun run build` | Production build (Cloudflare target) |
| `bun run build:dev` | Build with `mode=development` |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | ESLint over the repo |
| `bun run format` | Prettier write |

## How to play

Once the dev server is up, you land on `/` (practice):

1. Pick **content** (letters / words / sentences / twisters / numbers) and **length** (10 / 25 / 50 / 100) from the mode bar at the top.
2. Toggle **hints** if you want each letter's Morse code shown below it.
3. Start keying. The input visualizer card above the prompt shows your live dits and dahs against the target.

### Keys

| Key | Action |
| --- | --- |
| `j` | dit (two-key scheme — default) |
| `k` | dah (two-key scheme) |
| `.` / `-` | dit / dah (literal scheme) |
| `space` | tap = dit, hold = dah (paddle scheme) |
| `tab` + `enter` | restart |
| `esc` | open settings (switch input scheme, gap mode, audio, unit duration) |

### Routes

- `/` — practice / test
- `/about` — learn page, ITU timing primer, full alphabet + numbers + punctuation chart
- `/leaderboard` — top 50 sessions by WPM (Supabase-backed, filterable by mode and content)

## Project layout

```
src/
├─ routes/                # TanStack Router file routes
│  ├─ __root.tsx
│  ├─ index.tsx           # /  practice
│  ├─ about.tsx           # /about  learn
│  └─ leaderboard.tsx     # /leaderboard
├─ components/
│  ├─ morse/              # Test UI: Header, ModeBar, MorsePrompt,
│  │                      # InputVisualizer, StatsBar, Results,
│  │                      # SettingsDialog, TypingTest
│  └─ ui/                 # shadcn primitives
├─ lib/morse/             # alphabet, content generator, audio,
│                         # useMorseInput hook, wpm, storage
└─ styles.css             # design tokens (palette, .pill, .mode-cluster,
                          # .stat-value, .stat-label, .caret)
```

## Deployment

The repo is wired for Cloudflare via `wrangler.jsonc` and `@cloudflare/vite-plugin`. After `bun run build`, deploy with:

```bash
bunx wrangler deploy
```
