import { useEffect, useRef, useState } from "react";
import { REVERSE_MORSE } from "./alphabet";
import { beep } from "./audio";

export type InputScheme = "paddle" | "two_key" | "literal";
export type GapMode = "auto" | "explicit";

export interface MorseInputOptions {
  scheme: InputScheme;
  gapMode: GapMode;
  unitMs: number; // dit length in ms (e.g. 60ms = 20 wpm)
  audio: boolean;
  enabled: boolean;
  /** Decoder table mapping morse string -> character. Defaults to International (English) Morse. */
  reverseMorse?: Record<string, string>;
  onChar: (ch: string) => void; // emits decoded letter, or " " for word break, or "?" for unknown
  onSymbol?: (s: "." | "-") => void; // for live preview of current letter
  onReset?: () => void; // current-letter buffer cleared
}

const PADDLE_KEY = " ";
const TWO_DIT = "j";
const TWO_DAH = "k";
const LITERAL_DIT = ".";
const LITERAL_DAH = "-";

export function useMorseInput(opts: MorseInputOptions) {
  const buf = useRef("");
  const downAt = useRef<number | null>(null);
  const lastUpAt = useRef<number | null>(null);
  const letterTimer = useRef<number | null>(null);
  const wordTimer = useRef<number | null>(null);
  const [current, setCurrent] = useState("");

  // keep latest opts in ref so listeners are stable
  const optsRef = useRef(opts);
  optsRef.current = opts;

  function flushLetter() {
    const o = optsRef.current;
    const b = buf.current;
    if (!b) return;
    const table = o.reverseMorse ?? REVERSE_MORSE;
    const decoded = table[b] ?? "?";
    o.onChar(decoded);
    buf.current = "";
    setCurrent("");
    o.onReset?.();
  }

  function emitWord() {
    flushLetter();
    optsRef.current.onChar(" ");
  }

  function pushSymbol(s: "." | "-") {
    const o = optsRef.current;
    buf.current += s;
    setCurrent(buf.current);
    o.onSymbol?.(s);
    if (o.audio) beep(s === "." ? o.unitMs : o.unitMs * 3);
    if (o.gapMode === "auto") {
      if (letterTimer.current) window.clearTimeout(letterTimer.current);
      if (wordTimer.current) window.clearTimeout(wordTimer.current);
      letterTimer.current = window.setTimeout(flushLetter, o.unitMs * 3);
      wordTimer.current = window.setTimeout(emitWord, o.unitMs * 7);
    }
  }

  useEffect(() => {
    if (!opts.enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      const o = optsRef.current;
      if (e.repeat) return;
      const k = e.key;

      // Always: explicit gap controls (when gap mode = explicit) for non-paddle
      if (o.gapMode === "explicit" && o.scheme !== "paddle") {
        if (k === " ") { e.preventDefault(); flushLetter(); return; }
        if (k === "Enter") { e.preventDefault(); emitWord(); return; }
      }

      if (o.scheme === "paddle") {
        if (k === PADDLE_KEY) {
          e.preventDefault();
          if (downAt.current == null) downAt.current = performance.now();
          return;
        }
        // even in paddle, Enter = word break (Tab handled by parent for restart)
        if (k === "Enter") { e.preventDefault(); emitWord(); return; }
        return;
      }

      if (o.scheme === "two_key") {
        if (k.toLowerCase() === TWO_DIT) { e.preventDefault(); pushSymbol("."); return; }
        if (k.toLowerCase() === TWO_DAH) { e.preventDefault(); pushSymbol("-"); return; }
        return;
      }

      if (o.scheme === "literal") {
        if (k === LITERAL_DIT) { e.preventDefault(); pushSymbol("."); return; }
        if (k === LITERAL_DAH) { e.preventDefault(); pushSymbol("-"); return; }
        return;
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      const o = optsRef.current;
      if (o.scheme !== "paddle") return;
      if (e.key !== PADDLE_KEY) return;
      e.preventDefault();
      const start = downAt.current;
      downAt.current = null;
      if (start == null) return;
      const held = performance.now() - start;
      const isDah = held >= o.unitMs * 2; // tap shorter than 2 units = dit
      pushSymbol(isDah ? "-" : ".");
      lastUpAt.current = performance.now();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (letterTimer.current) window.clearTimeout(letterTimer.current);
      if (wordTimer.current) window.clearTimeout(wordTimer.current);
    };
  }, [opts.enabled]);

  function reset() {
    buf.current = "";
    setCurrent("");
    downAt.current = null;
    if (letterTimer.current) window.clearTimeout(letterTimer.current);
    if (wordTimer.current) window.clearTimeout(wordTimer.current);
  }

  return { currentMorse: current, reset, flushLetter, emitWord };
}
