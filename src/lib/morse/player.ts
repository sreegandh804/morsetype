import { MORSE } from "./alphabet";
import { emitSymbol, type SymbolAudioOptions } from "./audio";

export interface PlayerOptions extends SymbolAudioOptions {
  unitMs: number;
  farnsworth?: boolean;
  /** called when a new symbol begins playing (envelope on) */
  onSymbolStart?: (s: "." | "-") => void;
  /** called after a complete letter has finished sounding */
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

/**
 * Schedule playback of `text` using setTimeout chains.
 * Honors letter (3u) and word (7u) gaps; Farnsworth multiplies inter-letter
 * and inter-word gaps to keep symbol speed high while spacing is generous.
 */
export function play(text: string, opts: PlayerOptions): Playback {
  const unit = opts.unitMs;
  const farn = opts.farnsworth ? 2.5 : 1;

  type Step =
    | { kind: "sym"; sym: "." | "-"; durMs: number }
    | { kind: "intra"; ms: number }
    | { kind: "letter"; ch: string; gapMs: number }
    | { kind: "word"; gapMs: number };

  const steps: Step[] = [];
  const wordStartIdx: number[] = [];
  const chars = text.split("");
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === " ") {
      steps.push({ kind: "word", gapMs: unit * 7 * farn - unit * 3 * farn });
      wordStartIdx.push(steps.length);
      continue;
    }
    const code = MORSE[ch.toUpperCase()];
    if (!code) continue;
    if (i === 0) wordStartIdx.push(0);
    for (let s = 0; s < code.length; s++) {
      const sym = code[s] as "." | "-";
      steps.push({ kind: "sym", sym, durMs: sym === "." ? unit : unit * 3 });
      if (s < code.length - 1) steps.push({ kind: "intra", ms: unit });
    }
    steps.push({ kind: "letter", ch, gapMs: unit * 3 * farn });
  }

  let idx = 0;
  let timer: number | null = null;
  let paused = false;
  let stopped = false;

  function tick() {
    if (stopped) return;
    if (paused) return;
    if (idx >= steps.length) {
      opts.onDone?.();
      return;
    }
    const step = steps[idx++];
    if (step.kind === "sym") {
      emitSymbol(step.sym, unit, opts);
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
      if (timer) { window.clearTimeout(timer); timer = null; }
    },
    resume() {
      if (!paused || stopped) return;
      paused = false;
      tick();
    },
    stop() {
      stopped = true;
      if (timer) { window.clearTimeout(timer); timer = null; }
    },
    replayLastWord() {
      // Find the most recent word boundary <= idx
      let target = 0;
      for (let i = wordStartIdx.length - 1; i >= 0; i--) {
        if (wordStartIdx[i] <= idx - 1) { target = wordStartIdx[i]; break; }
      }
      if (timer) { window.clearTimeout(timer); timer = null; }
      idx = target;
      paused = false;
      tick();
    },
    isPlaying() {
      return !paused && !stopped;
    },
  };
}