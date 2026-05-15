## Goal

Make the single-input (spacebar) experience feel like operating a real straight key — and give newcomers a short, on-brand way to learn the rhythm before they're thrown into a test.

---

## 1. Fix the "always dit" bug (paddle / spacebar mode)

Likely causes to investigate in `useMorseInput.ts` and `TypingTest.tsx`:
- The page-level keydown handler may be calling `e.preventDefault()` on space (via the Tab/Enter restart logic) and disrupting the keyup pairing.
- `e.repeat` on a held spacebar can fire many keydowns; if any path resets `downAt`, the measured hold collapses to ~0 and reads as a dit.
- Browser may scroll on space and steal focus on some layouts.

Fix: make sure space in paddle mode is captured exclusively by `useMorseInput`, `e.preventDefault()` always runs on both down and up, repeats are ignored, and `downAt` is only set on the FIRST keydown of a press.

Verify with a small on-screen "last hold: 187ms · threshold: 160ms · → DAH" debug readout in dev only, removed before ship.

---

## 2. Single-input as a first-class mode with a "Realism" dial

Rename the current `paddle` scheme to **"Straight key (spacebar)"** in the UI — this is the one authentic operators used. Keep `two_key (j/k)` and `literal (./-)` available as alternatives.

Add a new setting **Realism** (3 stops on a slider) that maps to the dit/dah threshold + send WPM together, so the user picks one knob:

| Stop | Feel | dit unit | dah threshold |
|---|---|---|---|
| Practice | Slow & forgiving | 140ms (~9 WPM) | 2.5× unit (350ms) |
| Authentic | Real shipboard cadence | 80ms (~15 WPM) | 2× unit (160ms) |
| Sparks | Fast operator | 50ms (~24 WPM) | 1.8× unit (90ms) |

Power users can still override unit/threshold individually in advanced settings. Realism slider is the friendly front door.

**Press meter:** while spacebar is held, the existing telegraph-key SVG already depresses — add a thin progress bar underneath the key that fills from 0 → dah-threshold so the user can SEE the moment their press tips into a dah. This single visual fixes 90% of "I can't tell what counts as long" confusion without a tutorial.

---

## 3. Mini tutorial — "Learn the key"

Always available, never auto-launched (per user preference). Entry points:
- A small `learn the key` link in the header (next to Send/Receive toggle).
- Inline link under the input help row: "new to a single key? learn the rhythm".

Themed as a short, in-character training session — same paper-tape + telegraph-key aesthetic as the main app, NOT a modal carpet-bomb. Four micro-steps, each one screen, advance with the key itself (sending the right symbol = next step):

1. **Tap → dit.** "A short tap is a dit. Send one." Visual: telegraph key + press meter shown clearly. User presses spacebar briefly. ✓ on success.
2. **Hold → dah.** "Hold it down past the line for a dah." Press meter highlights the dah threshold. User holds. ✓ on success.
3. **Send E (·) and T (−).** Two single-symbol letters. Reinforces dit vs dah without timing-gap complexity.
4. **Send your callsign: "ET".** Combines the two letters with the auto letter-gap. Done — drop them back at the test with their selected realism.

No "press Next" buttons — they progress by sending the right thing, which is the whole point.

After completion, a tiny note: "you can replay this anytime from the header."

---

## Out of scope for this plan

- Personal-calibration capture (sample N dits + N dahs to derive a custom threshold). Skipped: the Realism slider + visual press meter solves the same problem more simply. Can revisit if users still struggle.
- Adaptive threshold drift. Same reason.
- Letter/word gap drills. Already taught implicitly in step 4; a dedicated drill would bloat the tutorial.

---

## Files I expect to touch

- `src/lib/morse/useMorseInput.ts` — bug fix, ignore `e.repeat` cleanly, ensure space preventDefault on both down/up.
- `src/components/morse/TypingTest.tsx` — make sure the global key handler doesn't shadow space.
- `src/components/morse/TelegraphKey.tsx` — add the press-meter bar.
- `src/lib/morse/storage.ts` — add `realism: "practice" | "authentic" | "sparks"` and `dahThresholdUnits: number`; derive unitMs/threshold from realism.
- `src/components/morse/SettingsDialog.tsx` + `ModeBar.tsx` — surface the Realism slider; rename paddle → "Straight key".
- `src/components/morse/Header.tsx` — add "learn the key" link.
- `src/routes/learn-key.tsx` (new) + `src/components/morse/KeyTutorial.tsx` (new) — the 4-step micro-tutorial.

Quietly fix the SSR hydration mismatch on `wordCount` pills + initial pellet styles while in those files (root cause: settings read from localStorage on first render — needs to defer the client-only branch until after mount).
