import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { TelegraphKey } from "./TelegraphKey";
import { TransmissionLog } from "./TransmissionLog";
import { useMorseInput } from "@/lib/morse/useMorseInput";
import { loadSettings, saveSettings, REALISM_PRESETS, applyRealism, DEFAULT_SETTINGS, type Settings, type Realism } from "@/lib/morse/storage";
import { useApplyTheme } from "@/hooks/use-theme";

type Step = {
  id: number;
  title: string;
  prompt: string;
  hint: string;
  /** What the user must produce to advance. */
  expect:
    | { kind: "symbol"; value: "." | "-" }
    | { kind: "char"; value: string }
    | { kind: "sequence"; value: string };
  /** Visual indicator shown above the key. */
  display: string;
};

const STEPS: Step[] = [
  {
    id: 1,
    title: "tap → dit",
    prompt: "a short tap is a dit. send one.",
    hint: "press and release the spacebar quickly — before the meter crosses the line.",
    expect: { kind: "symbol", value: "." },
    display: "·",
  },
  {
    id: 2,
    title: "hold → dah",
    prompt: "a long hold is a dah. send one.",
    hint: "hold the spacebar until the meter passes the dah line, then release.",
    expect: { kind: "symbol", value: "-" },
    display: "−",
  },
  {
    id: 3,
    title: "send T  ( − )",
    prompt: "send the letter T — one dah.",
    hint: "T is the second-shortest letter in morse. one good hold.",
    expect: { kind: "char", value: "T" },
    display: "T  −",
  },
  {
    id: 4,
    title: "send your callsign — ET",
    prompt: "send E then T — a dit, a pause, a dah.",
    hint: "after a symbol, wait ~3 dit-units of silence and the next letter starts.",
    expect: { kind: "sequence", value: "ET" },
    display: "ET  · −",
  },
];

export function KeyTutorial() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => {
    const loaded = loadSettings();
    // Force paddle scheme for the tutorial; restore on unmount via state only.
    setSettings({ ...loaded, scheme: "paddle" });
  }, []);
  useApplyTheme(settings.theme);

  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [history, setHistory] = useState<{ symbols: string; correct: boolean }[]>([]);
  const seqBuf = useRef<string>("");
  const fbTimer = useRef<number | null>(null);

  const step = STEPS[stepIdx];

  function flash(kind: "correct" | "wrong") {
    setFeedback(kind);
    if (fbTimer.current) window.clearTimeout(fbTimer.current);
    fbTimer.current = window.setTimeout(() => setFeedback(null), 700);
  }

  function advance() {
    seqBuf.current = "";
    flash("correct");
    if (stepIdx + 1 >= STEPS.length) {
      setDone(true);
    } else {
      setStepIdx((i) => i + 1);
    }
  }

  function handleChar(decoded: string, symbols: string) {
    if (done) return;
    if (step.expect.kind === "symbol") {
      // any letter input means we evaluate by its first symbol (single-symbol letters only)
      const ok = symbols === step.expect.value;
      setHistory((h) => [...h, { symbols, correct: ok }]);
      if (ok) advance();
      else flash("wrong");
      return;
    }
    if (step.expect.kind === "char") {
      const ok = decoded.toUpperCase() === step.expect.value;
      setHistory((h) => [...h, { symbols, correct: ok }]);
      if (ok) advance();
      else flash("wrong");
      return;
    }
    if (step.expect.kind === "sequence") {
      if (decoded === " ") return;
      seqBuf.current += decoded.toUpperCase();
      const target = step.expect.value;
      const matches = target.startsWith(seqBuf.current);
      setHistory((h) => [...h, { symbols, correct: matches }]);
      if (!matches) {
        flash("wrong");
        seqBuf.current = "";
        return;
      }
      if (seqBuf.current === target) advance();
    }
  }

  function handleInvalid(symbols: string) {
    if (done) return;
    setHistory((h) => [...h, { symbols, correct: false }]);
    flash("wrong");
    seqBuf.current = "";
  }

  function reset() {
    setStepIdx(0);
    setDone(false);
    setHistory([]);
    seqBuf.current = "";
  }

  const { currentMorse, lastSymbolAt, pressStartAt } = useMorseInput({
    scheme: "paddle",
    gapMode: "auto",
    unitMs: settings.unitMs,
    dahThresholdUnits: settings.dahThresholdUnits,
    audio: settings.audio,
    pitchHz: settings.pitchHz,
    audioMode: settings.audioMode,
    waveform: settings.waveform,
    vintage: settings.vintage,
    enabled: !done,
    onChar: handleChar,
    onInvalid: handleInvalid,
  });

  const dahThresholdMs = settings.unitMs * settings.dahThresholdUnits;

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto px-4">
      {/* progress dots */}
      <div className="flex items-center gap-2 mb-7">
        {STEPS.map((s, i) => (
          <span
            key={s.id}
            className="block rounded-full transition-all"
            style={{
              width: i === stepIdx && !done ? 22 : 8,
              height: 6,
              background:
                i < stepIdx || done ? "var(--color-main)" : i === stepIdx
