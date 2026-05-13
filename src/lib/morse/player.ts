import { MORSE } from "./alphabet";
import { emitSymbol, type SymbolAudioOptions } from "./audio";
import { computeTiming, wpmFromUnitMs, type MorseTiming } from "./timing";

export interface PlayerOptions extends SymbolAudioOptions {
  /** Character (element) speed in WPM. Preferred over `unitMs`. */
  characterWpm?: number;
  /** Overall PARIS speed in WPM (≤ characterWpm). Stretches inter-letter/word gaps. */
  effectiveWpm?: number;
  /** Legacy: character-speed dit length in ms. Ignored if `characterWpm` is set. */
  unitMs?: number;
  /** Legacy boolean Farnsworth. Maps to ~0.55× effective speed when no `effectiveWpm`. */
  farnsworth?: boolean;
  /** called when a new symbol begins playing (envelope on) */
  onSymbolStart?: (s: "." | "-") => void;
  /** called after a complete letter has finished sounding (" " for a word gap) */
  onLetterEnd?: (ch: string) => void;
  /** called when entire text has finished */
  onDone?: () => void;
}

export interface Playback {
  pause: () => void;
  resume: () => void;
  stop: () => void;
  replayLastWord: () => void;
  isPlaying: () => boolean;
}

export function resolveTiming(opts: PlayerOptions): MorseTiming {
  if (opts.characterWpm != null) return computeTiming(opts.characterWpm, opts.effectiveWpm);
  const charWpm = wpmFromUnitMs(opts.unitMs ?? 80);
  const eff = opts.effectiveWpm ?? (opts.farnsworth ? charWpm * 0.55 : charWpm);
  return computeTiming(charWpm, eff);
}

/**
 * Schedule playback of `text` using setTimeout chains. Honours proper Farnsworth
 * spacing: dits/dahs stay at character speed, inter-letter & inter-word gaps stretch.
 */
export function play(text: string, opts: PlayerOptions): Playback {
  const t = resolveTiming(opts);
  // Character speed unit feeds the audio envelope (emitSymbol takes a unit ms).
  const unitForAudio = t.ditC;

  type Step =
    | { kind: "sym"; sym: "." | "-"; durMs: number }
    | { kind: "intra"; ms: number }
    | { kind: "letter"; ch: string; gapMs: number }
    | { kind: "word"; gapMs: number };

  const steps: Step[] = [];
  const wordStartIdx: number[] = [];
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === " ") {
      // After the previous letter we already scheduled a 3-unit letter gap;
      // a word gap is 7 units total, so add the remaining 4.
      steps.push({ kind: "word", gapMs: t.wordGap - t.letterGap });
      wordStartIdx.push(steps.length);
      continue;
    }
    const code = MORSE[ch.toUpperCase()];
    if (!code) continue;
    if (i === 0) wordStartIdx.push(0);
    for (let s = 0; s < code.length; s++) {
      const sym = code[s] as "." | "-";
      steps.push({ kind: "sym", sym, durMs: sym === "." ? t.dit : t.dah });
      if (s < code.length - 1) steps.push({ kind: "intra", ms: t.intraGap });
    }
    steps.push({ kind: "letter", ch, gapMs: t.letterGap });
  }

  let idx = 0;
  let timer: number | null = null;
  let paused = false;
  let stopped = false;

  function tick() {
    if (stopped || paused) return;
    if (idx >= steps.length) {
      opts.onDone?.();
      return;
    }
    const step = steps[idx++];
    if (step.kind === "sym") {
      emitSymbol(step.sym, unitForAudio, opts);
      opts.onSymbolStart?.(step.sym);
      timer = window.setTimeout(tick, step.durMs);
    } else if (step.kind === "intra") {
      timer = window.setTimeout(tick, step.ms);
    } else if (step.kind === "letter") {
      opts.onLetterEnd?.(step.ch);
      timer = window.setTimeout(tick, step.gapMs);
    } else {
      opts.onLetterEnd?.(" ");
      timer = window.setTimeout(tick, step.gapMs);
    }
  }

  tick();

  return {
    pause() {
      paused = true;
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
    },
    resume() {
      if (!paused || stopped) return;
      paused = false;
      tick();
    },
    stop() {
      stopped = true;
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
    },
    replayLastWord() {
      let target = 0;
      for (let i = wordStartIdx.length - 1; i >= 0; i--) {
        if (wordStartIdx[i] <= idx - 1) {
          target = wordStartIdx[i];
          break;
        }
      }
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
      idx = target;
      paused = false;
      tick();
    },
    isPlaying() {
      return !paused && !stopped;
    },
  };
}
