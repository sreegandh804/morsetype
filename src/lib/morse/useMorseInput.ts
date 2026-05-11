import { useEffect, useRef, useState } from "react";
import { REVERSE_MORSE } from "./alphabet";
import { emitSymbol, type Waveform } from "./audio";

export type InputScheme = "paddle" | "two_key" | "literal";
export type GapMode = "auto" | "explicit";

export interface MorseInputOptions {
  scheme: InputScheme;
  gapMode: GapMode;
  unitMs: number;
  audio: boolean;
  pitchHz: number;
  audioMode?: "tone" | "sounder";
  waveform?: Waveform;
  vintage?: boolean;
  enabled: boolean;
  onChar: (ch: string, symbols: string) => void;
  onInvalid?: (symbols: string) => void;
  onBackspace?: () => void;
  onSymbol?: (s: "." | "-") => void;
  onReset?: () => void;
}

const PADDLE_KEY = " ";
const TWO_DIT = "j";
const TWO_DAH = "k";
const LITERAL_DIT = ".";
const LITERAL_DAH = "-";

export function useMorseInput(opts: MorseInputOptions) {
  const buf = useRef("");
  const downAt = useRef<number | null>(null);
  const letterTimer = useRef<number | null>(null);
  const wordTimer = useRef<number | null>(null);
  const [current, setCurrent] = useState("");
  const [lastSymbolAt, setLastSymbolAt] = useState<number | null>(null);
  const [pressStartAt, setPressStartAt] = useState<number | null>(null);

  const optsRef = useRef(opts);
  optsRef.current = opts;

  function flushLetter() {
    const o = optsRef.current;
    const b = buf.current;
    if (!b) return;
    const decoded = REVERSE_MORSE[b];
    buf.current = "";
    setCurrent("");
    setLastSymbolAt(null);
    o.onReset?.();
    if (decoded === undefined) {
      o.onInvalid?.(b);
      return;
    }
    o.onChar(decoded, b);
  }

  function emitWord() {
    flushLetter();
    optsRef.current.onChar(" ", "");
    setLastSymbolAt(null);
  }

  function pushSymbol(s: "." | "-") {
    const o = optsRef.current;
    buf.current += s;
    setCurrent(buf.current);
    setLastSymbolAt(performance.now());
    o.onSymbol?.(s);
    emitSymbol(s, o.unitMs, {
      audio: o.audio,
      audioMode: o.audioMode ?? "tone",
      pitchHz: o.pitchHz,
      waveform: o.waveform ?? "sine",
      vintage: o.vintage,
    });
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

      if (k === "Backspace") {
        e.preventDefault();
        if (buf.current.length > 0) {
          buf.current = buf.current.slice(0, -1);
          setCurrent(buf.current);
          if (buf.current.length === 0) {
            setLastSymbolAt(null);
            if (letterTimer.current) window.clearTimeout(letterTimer.current);
            if (wordTimer.current) window.clearTimeout(wordTimer.current);
          } else {
            setLastSymbolAt(performance.now());
          }
        } else {
          o.onBackspace?.();
        }
        return;
      }

      if (o.gapMode === "explicit" && o.scheme !== "paddle") {
        if (k === " ") { e.preventDefault(); flushLetter(); return; }
        if (k === "Enter") { e.preventDefault(); emitWord(); return; }
      }

      if (o.scheme === "paddle") {
        if (k === PADDLE_KEY) {
          e.preventDefault();
          if (downAt.current == null) {
            downAt.current = performance.now();
            setPressStartAt(downAt.current);
          }
          return;
        }
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
      setPressStartAt(null);
      if (start == null) return;
      const held = performance.now() - start;
      const isDah = held >= o.unitMs * 2;
      pushSymbol(isDah ? "-" : ".");
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
    setLastSymbolAt(null);
    setPressStartAt(null);
    downAt.current = null;
    if (letterTimer.current) window.clearTimeout(letterTimer.current);
    if (wordTimer.current) window.clearTimeout(wordTimer.current);
  }

  return { currentMorse: current, lastSymbolAt, pressStartAt, reset, flushLetter, emitWord };
}
