# MorseType — Monkeytype-style Morse Code Trainer

A keyboard-driven Morse code practice app with Monkeytype's exact UX principles: minimalist, dark, monospace, caret-driven, instant green/red feedback, frictionless restart on Tab+Enter.

## Design (Monkeytype DNA)

- Dark warm-charcoal background, signature mustard-yellow accent
- JetBrains Mono everywhere
- Centered prompt, dim untyped text → bright current → green correct / red incorrect
- Top: tiny logo + horizontal pill toolbar (mode | content | time/length | input scheme)
- Bottom: live `wpm  acc  time` ticker (subtle, only highlighted on the results screen)
- Results screen: large WPM, accuracy, character chart, "Next test" / "Restart" hints
- Keyboard-first: `Tab` then `Enter` restarts, `Esc` opens command palette
- Single dark theme for v1 (Monkeytype "serika dark" inspired)

## Features

### 1. Practice modes
- **Learn** — Each letter shown WITH its Morse pattern beneath (`A .-`). Beginner-friendly.
- **Test** — Letters only. Recall from memory. Live green/red per character (Monkeytype-style).
- **Listen** *(stretch)* — Hear Morse, type the letter.

### 2. Content / difficulty
- **Letters** (random A–Z)
- **Common words**
- **Sentences / quotes**
- **Tongue twisters** (extra challenge)
- **Numbers & punctuation** (advanced)
- Length presets: 15s / 30s / 60s / 120s OR 10 / 25 / 50 / 100 words

### 3. Input schemes (user-configurable)
- **Single key (paddle)** — `Space`: tap = dit, hold ≥ threshold = dah. Hardest; tests timing.
- **Two keys** — `J` = dit, `K` = dah (defaults; remappable).
- **Literal** — `.` = dit, `-` = dah. Easiest.
- **Letter/word break detection**:
  - **Auto-timing** (ITU-standard): 3-unit pause = letter break, 7-unit = word break. Unit length user-set (15–40 WPM).
  - **Explicit**: `Space` = letter break, `Enter` = word break (when not using Space as paddle).
- Optional **audio sidetone** (Web Audio, 600 Hz) — toggle on/off.

### 4. Live stats (Monkeytype parity)
- WPM (PARIS standard adapted: 50 dit-units per word)
- Accuracy %
- Raw CPM
- Live timer / progress bar
- Per-character correctness map for results chart

### 5. Leaderboard
- Lovable Cloud table `leaderboard_entries` (name, wpm, accuracy, mode, content, input_scheme, created_at)
- RLS: public read; public insert with name validation (length 1–20)
- Top 10 per filter (mode + content)
- Submit name modal after a completed run

### 6. Settings (Esc / gear icon)
- Input scheme + key bindings
- WPM unit speed (for auto-timing)
- Audio on/off + frequency
- Show Morse hints under letters (forces Learn mode)
- Reference: full Morse alphabet chart on `/about`

## Routes

```text
src/routes/
  __root.tsx          header + theme shell
  index.tsx           main typing test
  leaderboard.tsx     rankings, filterable
  about.tsx           how-to + full Morse chart + ITU timing explainer
```

## Components & lib

```text
src/components/
  TypingTest.tsx      orchestrator
  MorsePrompt.tsx     dim/bright/green/red character renderer + caret
  ModeBar.tsx         pills: mode / content / length / input scheme
  StatsBar.tsx        live wpm / acc / timer
  Results.tsx         post-test summary + submit-to-leaderboard
  MorseChart.tsx      reference grid
  SettingsDialog.tsx  input scheme + key bindings + audio
  CommandPalette.tsx  Esc-triggered quick switcher (stretch)

src/lib/
  morse.ts            ITU alphabet map, encode/decode, timing constants
  useMorseInput.ts    hook: handles all 3 input schemes + auto/explicit gap detection
  audio.ts            Web Audio sidetone
  wpm.ts              WPM/accuracy calc
  storage.ts          settings persistence (localStorage)
```

## Design tokens (`src/styles.css`)

oklch dark palette inspired by Monkeytype's serika-dark:
- `--background` — warm charcoal
- `--sub` — dim text (untyped)
- `--text` — bright text (current/typed)
- `--main` — mustard-yellow accent (caret, active pill, primary)
- `--success` — green (correct char)
- `--error` — red (incorrect char)
- `--sub-alt` — slightly lighter charcoal (cards, dialogs)

JetBrains Mono via Google Fonts in `__root.tsx` head.

## Backend (Lovable Cloud)

Single migration:
```sql
create table leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 20),
  wpm numeric not null,
  accuracy numeric not null,
  mode text not null,
  content text not null,
  input_scheme text not null,
  created_at timestamptz not null default now()
);
alter table leaderboard_entries enable row level security;
create policy "public read" on leaderboard_entries for select using (true);
create policy "public insert" on leaderboard_entries for insert with check (true);
create index on leaderboard_entries (mode, content, wpm desc);
```

## Out of scope (v1)
- User accounts / persistent profiles
- Multiplayer races
- Multiple themes (one polished dark theme only)
- Iambic paddle modes A/B
- Mobile touch input (keyboard-only for v1)

Ready to build — I'll enable Lovable Cloud, set up tokens + fonts, then implement the typing engine, screens, and leaderboard.