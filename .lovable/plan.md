# MorseType v2 — Telegraph Soul + Decode Mode

Three additions, all sharing the existing engine and design tokens. Sending stays the primary experience; decoding is a secondary mode reached via a subtle toggle.

## 1. Telegraph Key Aesthetics & Sound

**Authentic sounder mode** — Settings → Audio → `tone | sounder`
- `src/lib/morse/audio.ts` extended with `clack(kind: "down" | "up")`: a short filtered noise burst (band-passed white noise + sharp envelope, ~12 ms down-click, ~8 ms up-click). Synthesized in Web Audio — no audio assets to ship.
- Down-click on symbol start, up-click on symbol end. For dahs the two clicks are spaced by symbol length, exactly like a real Vibroplex sounder. Tone mode keeps the existing sine beep.

**Sidetone tuning** — new Settings → Audio section
- Pitch slider 450–900 Hz (currently fixed 600).
- Waveform: sine / square / triangle.
- "Vintage radio" toggle → routes osc through a `BiquadFilter` (band-pass ~600 Hz, Q ≈ 4) plus a `ConvolverNode` with a synthesized short impulse response (built in code).

**Visual telegraph key** — `src/components/morse/TelegraphKey.tsx`
- Small SVG (~120×80) pinned bottom-right of the test area.
- Auto-picks variant from input scheme:
  - `paddle` / `literal` → straight key (lever pivots down on key-down).
  - `two_key` → iambic paddle (left = dit, right = dah, each tilts independently).
- Driven by existing `pressStartAt` from `useMorseInput`. CSS transform with 80 ms ease, respects `prefers-reduced-motion`.

**Paper tape printer** — restyle existing `TransmissionLog`
- Update `.transmission-log` in `src/styles.css`: cream/manila tile background, perforation strips top & bottom (CSS `radial-gradient` dots), inked dits/dahs in dark ink color, faint typewriter letter under each correct cluster.
- Slow rightward scroll on new symbols (~180 ms `translateX`).

## 2. Progressive Difficulty Ranks (replaces "tongue twisters")

Replace `tongue_twisters` content with a **Ranks** mode.

| Rank | Pool | WPM floor | Punctuation | Prosigns |
|---|---|---|---|---|
| Cadet | letters + short common words | 10 wpm | — | — |
| Operator | common words + short sentences | 15 wpm | `. ,` | — |
| Sparks | sentences + numbers + callsigns | 20 wpm | `. , ? /` | `<AR> <BT>` |
| Chief Radioman | long-form + Q-codes + callsigns | 25 wpm | full set | `<AR> <BT> <SK> <KN>` |

- New `src/lib/morse/ranks.ts` with `RANKS` config + `generateForRank(rank, wordCount)`.
- `content.ts`: drop `tongue_twisters`, add a `ranks` content kind that delegates by `settings.rank`.
- `ModeBar`: replace the `twisters` pill with a 4-pill **rank selector**.
- Picking a rank auto-bumps `unitMs` to its floor (only if current is slower).
- Prosigns rendered like `<AR>` and treated as one multi-symbol token (one `flushLetter` after the run-together pattern).
- Add ham callsigns (`W1AW`, `K3LR`, `G0XYZ`, `VK2ABC`…) and Q-codes (`QTH QSL QRZ QSY QRM`) to the pool.
- Migration: add `rank` column to `leaderboard_entries`, leaderboard filterable by rank.

## 3. Decode Mode (Receiving Operator desk)

The "other side" — app sends Morse, you type the plaintext.

### Navigation (intuitive, non-primary)

A small two-segment toggle lives in the header next to the logo, not in the main nav:

```text
morsetype   [▶ send  · 🎧 receive]    practice   learn   leaderboard
```

- Left segment is selected by default and active on the home route `/`.
- Right segment routes to a new `/receive` page.
- Visually the same `pill` style as `ModeBar` so it feels like part of the practice surface, not a top-level destination. Keyboard shortcut: `Ctrl/Cmd + Shift + R` toggles between them.
- Both `/` and `/receive` share the header, the `ModeBar` (mode/length/rank/audio/settings), the `StatsBar`, and the `Results` screen — only the middle prompt swaps.

### Audio-only is supported

Yes — confirmed. The receive view has a **"Audio only"** toggle in the audio cluster (next to the existing sound icon). When on:
- The oscilloscope strip and paper tape both fade to a dim "·" placeholder.
- Only the typed-text line and a tiny "now playing" pulse remain.
- Great pure-ear-training mode; perfect for the sounder + vintage radio combo.

When off (default), full operator desk:

```text
┌─────────────────────────────────────────────────┐
│  ░░░░  ▓  ░░░░░░  ▓  ░░░░  ▓▓▓  ░░░░  ▓        │  ← live waveform strip
│                                                 │     (oscilloscope, eye-candy
│            t h e   q u i _                      │     synced to envelope)
│                                                 │  ← MorsePrompt in decode mode:
│                                                 │     hidden target, green = matched
│                                                 │     red = wrong at that index
│   ●─── ──● ●●●● ●  ─── ●●─                      │  ← paper tape: what's been SENT
│                                                 │     so far (toggle on/off)
└─────────────────────────────────────────────────┘
        [▶ play]  [⏸ pause]  [↻ replay last word]
```

- **Top scope strip**: thin oscilloscope-like line, lights up while a tone plays, synced to audio envelope.
- **Middle**: existing `MorsePrompt` in decode variant — target hidden until run ends, only typed chars show with green/red.
- **Bottom paper tape**: repurposed `TransmissionLog` showing what's been transmitted (togglable; default on).
- Controls: play/pause, replay last word (huge for learning), speed slider, optional Farnsworth toggle.
- WPM = effective copy WPM (correct chars typed before next letter sent).

### Implementation sketch

- New route `src/routes/receive.tsx` and `DecodeTest.tsx` component.
- Header gains the segmented toggle (`SendReceiveToggle.tsx`).
- New `src/lib/morse/player.ts` schedules symbols/letter/word gaps using current unit timing, with optional Farnsworth.
- Reuses `audio.ts` (and the new sounder path) for playback.
- Input is the regular keyboard (a–z, 0–9, space, punctuation per rank). No morse encoding on the user side.
- Same `leaderboard_entries` table; add `direction` column (`send` | `decode`) so leaderboards split cleanly.
- "Audio only" preference persists in `settings.decodeAudioOnly`.

## Open question

One small confirm before I build:
- **Rank pill behavior**: when a rank is selected, should the content pool be **driven by the rank** (replacing the `letters / words / sentences / numbers` pills with the rank's curated pool), or stay **additive** (rank only sets difficulty floor; user still picks content)? My recommendation: **driven by rank** — cleaner, matches a real progression, and the existing pills can still be used when "no rank" is selected.

Reply yes/no on the rank behavior and I'll build everything above.
