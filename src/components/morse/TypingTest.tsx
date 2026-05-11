import { useEffect, useMemo, useRef, useState } from "react";
import { MorsePrompt } from "./MorsePrompt";
import { ModeBar } from "./ModeBar";
import { StatsBar } from "./StatsBar";
import { Results } from "./Results";
import { SettingsDialog } from "./SettingsDialog";
import { InputVisualizer } from "./InputVisualizer";
import { PaperTape } from "./PaperTape";
import { useMorseInput } from "@/lib/morse/useMorseInput";
import { generate } from "@/lib/morse/content";
import { calcAccuracy, calcWpm } from "@/lib/morse/wpm";
import { loadSettings, saveSettings, type Settings } from "@/lib/morse/storage";
import { MORSE } from "@/lib/morse/alphabet";
import { useApplyTheme } from "@/hooks/use-theme";

type Phase = "idle" | "running" | "done";

export function TypingTest() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  useApplyTheme(settings.theme);
  const [target, setTarget] = useState(() => generate(settings.content, settings.wordCount));
  const [typed, setTyped] = useState<string>("");
  const [errors, setErrors] = useState<boolean[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [invalidAt, setInvalidAt] = useState<number | null>(null);
  const [symbolHistory, setSymbolHistory] = useState("");

  const tickRef = useRef<number | null>(null);

  function patchSettings(patch: Partial<Settings>) {
    setSettings((s) => {
      const next = { ...s, ...patch };
      saveSettings(next);
      return next;
    });
  }

  function restart(nextSettings = settings) {
    setTarget(generate(nextSettings.content, nextSettings.wordCount));
    setTyped("");
    setErrors([]);
    setPhase("idle");
    setStartedAt(null);
    setElapsedMs(0);
    setInvalidAt(null);
    setSymbolHistory("");
  }

  function handleSymbol(s: "." | "-") {
    setSymbolHistory((h) => h + s);
  }

  function handleInvalid() {
    if (phase === "done") return;
    setInvalidAt(performance.now());
    setSymbolHistory((h) => h + " ");
  }

  function handleBackspace() {
    if (phase === "done") return;
    if (typed.length === 0) return;
    setTyped((s) => s.slice(0, -1));
    setErrors((e) => e.slice(0, -1));
    setSymbolHistory((h) => h.replace(/[ /]+$/, "").slice(0, -1));
    if (typed.length === 1) {
      setPhase("idle");
      setStartedAt(null);
      setElapsedMs(0);
    }
  }

  // restart whenever content/length changes
  useEffect(() => { restart(settings); /* eslint-disable-next-line */ }, [settings.content, settings.wordCount]);

  // tick timer
  useEffect(() => {
    if (phase !== "running" || startedAt == null) return;
    tickRef.current = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt);
    }, 100);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [phase, startedAt]);

  // global keyboard: Tab+Enter restart, Esc settings
  useEffect(() => {
    let tabPressed = false;
    function onKey(e: KeyboardEvent) {
      if (settingsOpen) {
        tabPressed = false;
        return;
      }
      if (e.key === "Escape") { e.preventDefault(); setSettingsOpen(true); return; }
      if (e.key === "Tab") { e.preventDefault(); tabPressed = true; return; }
      if (e.key === "Enter" && tabPressed) { e.preventDefault(); tabPressed = false; restart(); return; }
      if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta") return;
      tabPressed = false;
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settings, target, settingsOpen]);

  function handleChar(decoded: string) {
    if (phase === "done") return;
    if (phase === "idle") {
      const t = performance.now();
      setStartedAt(t);
      setPhase("running");
    }
    const expected = target[typed.length];
    if (expected == null) return;

    // Word break: only consume if expected is a space; otherwise ignore
    if (decoded === " ") {
      if (expected === " ") {
        setTyped((s) => s + " ");
        setErrors((e) => [...e, false]);
        setSymbolHistory((h) => h + "/");
      }
      return;
    }

    // For a normal letter: compare case-insensitively to expected
    if (expected === " ") {
      // user produced a letter where a space was expected — count as error and advance
      setTyped((s) => s + decoded);
      setErrors((e) => [...e, true]);
    } else {
      const ok = decoded.toUpperCase() === expected.toUpperCase();
      setTyped((s) => s + decoded);
      setErrors((e) => [...e, !ok]);
    }
    setSymbolHistory((h) => h + " ");
  }

  const enabled = phase !== "done" && !settingsOpen;
  const { currentMorse, lastSymbolAt, pressStartAt, reset } = useMorseInput({
    scheme: settings.scheme,
    gapMode: settings.gapMode,
    unitMs: settings.unitMs,
    audio: settings.audio,
    pitchHz: settings.pitchHz,
    enabled,
    onChar: handleChar,
    onInvalid: handleInvalid,
    onBackspace: handleBackspace,
    onSymbol: handleSymbol,
  });

  // detect completion
  useEffect(() => {
    if (phase === "running" && typed.length >= target.length) {
      const finalElapsed = startedAt ? performance.now() - startedAt : 0;
      // 73 — CW shorthand for "best regards" (7 = --..., 3 = ...--)
      setSymbolHistory((h) => h + " / --... ...-- ");
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const complete = () => {
        setPhase("done");
        setElapsedMs(finalElapsed);
        reset();
      };
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => unknown;
      };
      const delay = reduced ? 0 : 760;
      const t = window.setTimeout(() => {
        if (!reduced && typeof doc.startViewTransition === "function") {
          doc.startViewTransition(complete);
        } else {
          complete();
        }
      }, delay);
      return () => window.clearTimeout(t);
    }
  }, [typed, target, phase, startedAt, reset]);

  const correctCount = errors.filter((e, i) => !e && target[i] !== " ").length;
  const incorrectCount = errors.filter((e) => e).length;
  const totalChars = typed.replace(/\s/g, "").length;
  const wpm = useMemo(() => calcWpm(correctCount, elapsedMs || 1), [correctCount, elapsedMs]);
  const acc = calcAccuracy(correctCount, totalChars);

  const streak = useMemo(() => {
    let s = 0;
    for (let i = errors.length - 1; i >= 0; i--) {
      if (target[i] === " ") continue;
      if (errors[i] === false) s++;
      else break;
    }
    return s;
  }, [errors, target]);

  const currentChar = target[typed.length];
  const targetMorse =
    currentChar && currentChar !== " "
      ? MORSE[currentChar.toUpperCase()] ?? null
      : null;

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto px-8">
      <div className="mb-8">
        <ModeBar settings={settings} onChange={patchSettings} onOpenSettings={() => setSettingsOpen(true)} />
      </div>

      {phase !== "done" ? (
        <>
          <InputVisualizer
            currentInput={currentMorse}
            targetMorse={targetMorse}
            lastSymbolAt={lastSymbolAt}
            pressStartAt={pressStartAt}
            unitMs={settings.unitMs}
            gapMode={settings.gapMode}
            scheme={settings.scheme}
            invalidAt={invalidAt}
          />
          <div className="w-full">
            <MorsePrompt
              target={target}
              typed={typed}
              errors={errors}
              showHints={settings.showHints}
              currentMorse={currentMorse}
            />
          </div>
          <div className="w-full mt-6">
            <StatsBar
              wpm={wpm}
              acc={acc}
              elapsedMs={elapsedMs}
              total={target.length}
              typed={typed.length}
              active={phase === "running"}
              streak={streak}
            />
          </div>
          <PaperTape symbols={symbolHistory} idle={phase === "idle" && symbolHistory.length === 0} />
          <InputHelp scheme={settings.scheme} gapMode={settings.gapMode} />
        </>
      ) : (
        <Results
          wpm={wpm}
          acc={acc}
          elapsedMs={elapsedMs}
          correct={correctCount}
          incorrect={incorrectCount}
          settings={settings}
          onRestart={() => restart()}
        />
      )}

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} settings={settings} onChange={patchSettings} />
    </div>
  );
}

function InputHelp({ scheme, gapMode }: { scheme: string; gapMode: string }) {
  const inputHints =
    scheme === "paddle"
      ? [{ k: "space", v: "tap dit · hold dah" }]
      : scheme === "two_key"
        ? [{ k: "j", v: "dit" }, { k: "k", v: "dah" }]
        : [{ k: ".", v: "dit" }, { k: "-", v: "dah" }];
  const gapHint = gapMode === "auto" ? "auto-timing" : "space = letter · enter = word";
  return (
    <div className="mt-6 text-[11px] text-(--color-sub-faint) flex flex-wrap justify-center gap-x-5 gap-y-1 lowercase tracking-wide">
      {inputHints.map(h => (
        <span key={h.k}><span className="text-(--color-sub) font-medium">{h.k}</span> = {h.v}</span>
      ))}
      <span>{gapHint}</span>
      <span><span className="text-(--color-sub) font-medium">tab</span> = restart</span>
      <span><span className="text-(--color-sub) font-medium">esc</span> = settings</span>
    </div>
  );
}
