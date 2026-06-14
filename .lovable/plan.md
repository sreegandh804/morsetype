
## Three fixes from the notes

### 1. J/K mode: no repeats when key is held

Today `useMorseInput.ts` ignores `e.repeat` and only emits one symbol per keydown, so holding J/K just sits silent. A real iambic keyer emits a continuous stream of dits (or dahs) while the paddle is held, and alternates dit/dah when both paddles are held.

Change in `src/lib/morse/useMorseInput.ts` (two_key scheme only):
- On J keydown → start a repeating dit emitter at the symbol cadence (`unitMs` on, `unitMs` off).
- On K keydown → same with dahs (`3 × unitMs` on, `unitMs` off).
- If both are held → alternate (iambic mode A): whichever element is finishing, queue the other.
- On keyup → stop the repeat for that paddle.
- Keep `e.repeat` ignored (OS auto-repeat is not our cadence source — our interval timer is).
- Auto letter/word gap timers still fire after the last emitted symbol, so words still commit correctly.

Literal `.` / `-` mode keeps current behavior (one symbol per keypress) since that input has no real-world "hold" analogue.

### 2. Farnsworth: configurable character vs effective WPM

Replace the boolean with two numbers so 30/10 etc. is expressible.

`src/lib/morse/storage.ts`:
- Drop `decodeFarnsworth: boolean`.
- Add `characterWpm: number` (default 20) and `effectiveWpm: number` (default 20 = off).
- Migration in `loadSettings`: if old `decodeFarnsworth === true`, seed `characterWpm = 18, effectiveWpm = 10`; otherwise mirror current WPM.

`src/components/morse/SettingsDialog.tsx`:
- Replace the single "farnsworth (receive)" toggle with a "receive speed" subsection containing two sliders:
  - **character speed** 10–40 wpm
  - **effective speed** 5–40 wpm, clamped ≤ character speed (auto-lower if user drags above it).
- Helper text: "same as 30/10 on a paper tape — characters sent fast, gaps stretched so you have time to copy."

`src/components/morse/DecodeTest.tsx` and `learn/LessonSession.tsx`:
- Stop passing `farnsworth: boolean / unitMs`; pass `characterWpm` + `effectiveWpm` to `play(...)`. `player.ts` already accepts both.

### 3. Stop showing `.` and `-` under letters by default

Showing the morse pattern under each glyph short-circuits learning the sound. We will:

- Default `showHints` to `false` in `DEFAULT_SETTINGS` (existing users keep their stored value).
- In `src/components/morse/MorsePrompt.tsx`: stop rendering target morse under ghost/done letters. The only morse that ever appears below the prompt is the user's own live input on the current letter, and only while they're sending it. (This already partially exists — we'll tighten it so `showHints` no longer reveals the answer above unsent letters; it only controls whether the live readout stays visible after the letter is committed.)
- Rename the ModeBar pill from "hints" to "echo" and update its tooltip ("show your own keying live") so users know it isn't the answer key.
- Remove the morse glyph row from `KeyTutorial` step prompts that currently spoils E/T (replace with sound-only cue + the letter name).

### Out of scope

- No change to the receive `MorseStream` ticker — it shows the user's *received* symbols after the fact, which is feedback, not a spoiler.
- No change to the live `InputVisualizer` (the user's own keying readout is feedback, not a spoiler).
- No leaderboard, no schema changes.

### Files touched

- `src/lib/morse/useMorseInput.ts` — iambic repeat for two_key.
- `src/lib/morse/storage.ts` — `characterWpm` / `effectiveWpm`, migration, default `showHints: false`.
- `src/components/morse/SettingsDialog.tsx` — two WPM sliders replace the Farnsworth toggle.
- `src/components/morse/DecodeTest.tsx`, `src/components/morse/learn/LessonSession.tsx` — pass new WPM fields to `play(...)`.
- `src/components/morse/MorsePrompt.tsx` — no morse rendered under ghost/done letters.
- `src/components/morse/ModeBar.tsx` — rename "hints" → "echo".
- `src/components/morse/KeyTutorial.tsx` — drop the morse-glyph spoiler from step prompts.
