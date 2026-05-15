import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { TelegraphKey } from "./TelegraphKey";
import { TransmissionLog } from "./TransmissionLog";
import { useMorseInput } from "@/lib/morse/useMorseInput";
import {
  loadSettings,
  REALISM_PRESETS,
  applyRealism,
  DEFAULT_SETTINGS,
  type Settings,
  type Realism,
} from "@/lib/morse/storage";
import { useApplyTheme } from "@/hooks/use-theme";

type Step = {
  id: number;
  title: string;
  prompt: string;
  hint: string;
  expect:
    | { kind: "symbol"; value: "." | "-" }
    | { kind: "char"; value: string }
    | { kind: "sequence"; value: string };
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

  function setRealism(r: Exclude<Realism, "custom">) {
    setSettings((s) => ({ ...s, ...applyRealism(r) }));
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
      <div className="flex items-center gap-2 mb-7" aria-label="tutorial progress">
        {STEPS.map((s, i) => {
          const reached = i < stepIdx || done;
          const current = i === stepIdx && !done;
          return (
            <span
              key={s.id}
              className="block rounded-full transition-all"
              style={{
                width: current ? 22 : 8,
                height: 6,
                background: reached
                  ? "var(--color-main)"
                  : current
                    ? "var(--color-sub-strong)"
                    : "var(--color-sub-faint)",
              }}
            />
          );
        })}
      </div>

      {/* realism picker — small, header-row */}
      <div className="flex items-center gap-3 mb-6 text-[11px] text-(--color-sub-faint) lowercase tracking-wide">
        <span>cadence</span>
        {(Object.keys(REALISM_PRESETS) as Array<keyof typeof REALISM_PRESETS>).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setRealism(k)}
            className="pill"
            data-active={settings.realism === k}
          >
            {REALISM_PRESETS[k].label}
          </button>
        ))}
      </div>

      {!done ? (
        <>
          <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-(--color-sub-faint)">
            step {stepIdx + 1} of {STEPS.length}
          </div>
          <h2 className="font-display text-2xl text-(--color-text) lowercase tracking-tight mb-2">
            {step.title}
          </h2>
          <p className="text-(--color-sub-strong) text-sm text-center max-w-md mb-1">
            {step.prompt}
          </p>
          <p className="text-(--color-sub-faint) text-[11px] text-center max-w-md mb-7 lowercase">
            {step.hint}
          </p>

          {/* big symbol target */}
          <div
            className="font-mono text-(--color-main) leading-none mb-8 transition-colors"
            style={{
              fontSize: 64,
              letterSpacing: "0.15em",
              opacity: feedback === "wrong" ? 0.45 : 1,
              color: feedback === "wrong" ? "var(--color-error)" : undefined,
              textShadow:
                feedback === "correct" ? "0 0 24px var(--color-main-soft)" : "none",
            }}
            aria-live="polite"
          >
            {step.display}
          </div>

          {/* the key + meter */}
          <div className="mb-6">
            <TelegraphKey
              scheme="paddle"
              pressStartAt={pressStartAt}
              lastSymbolAt={lastSymbolAt}
              dahThresholdMs={dahThresholdMs}
            />
          </div>

          <div className="text-(--color-sub) font-mono text-base h-6 tracking-[0.3em]">
            {currentMorse || "\u00a0"}
          </div>

          <TransmissionLog letters={history} current={currentMorse} />

          <div className="mt-8 text-[11px] text-(--color-sub-faint) lowercase tracking-wide">
            stuck?{" "}
            <button
              type="button"
              onClick={reset}
              className="underline underline-offset-4 hover:text-(--color-sub)"
            >
              start over
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center text-center max-w-md py-8">
          <div className="text-(--color-main) text-2xl tracking-[0.4em] mb-4">
            ··· ·−·  −·− ·−·· ·−  ···
          </div>
          <h2 className="font-display text-2xl text-(--color-text) lowercase mb-2">
            you've got the rhythm
          </h2>
          <p className="text-(--color-sub-strong) text-sm mb-7">
            short = dit, long = dah, silence = the rest. that's the whole alphabet of timing.
            you can replay this anytime from the header.
          </p>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="pill"
              data-active="true"
            >
              start practicing →
            </Link>
            <button type="button" onClick={reset} className="pill">
              run it again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}