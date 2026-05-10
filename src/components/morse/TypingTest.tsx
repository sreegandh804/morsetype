import { useEffect, useMemo, useRef, useState } from "react";
import { MorsePrompt } from "./MorsePrompt";
import { ModeBar } from "./ModeBar";
import { StatsBar } from "./StatsBar";
import { Results } from "./Results";
import { SettingsDialog } from "./SettingsDialog";
import { useMorseInput } from "@/lib/morse/useMorseInput";
import { generate } from "@/lib/morse/content";
import { calcAccuracy, calcWpm } from "@/lib/morse/wpm";
import { loadSettings, saveSettings, type Settings } from "@/lib/morse/storage";

type Phase = "idle" | "running" | "done";

export function TypingTest() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [target, setTarget] = useState(() => generate(settings.content, settings.wordCount));
  const [typed, setTyped] = useState<string>("");
  const [errors, setErrors] = useState<boolean[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      if (e.key === "Escape") { e.preventDefault(); setSettingsOpen((o) => !o); return; }
      if (e.key === "Tab") { e.preventDefault(); tabPressed = true; return; }
      if (e.key === "Enter" && tabPressed) { e.preventDefault(); tabPressed = false; restart(); return; }
      if (e.key !== "Tab") tabPressed = false;
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settings, target]);

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
  }

  const enabled = phase !== "done" && !settingsOpen;
  const { currentMorse, reset } = useMorseInput({
    scheme: settings.scheme,
    gapMode: settings.gapMode,
    unitMs: settings.unitMs,
    audio: settings.audio,
    enabled,
    onChar: handleChar,
  });

  // detect completion
  useEffect(() => {
    if (phase === "running" && typed.length >= target.length) {
      setPhase("done");
      setElapsedMs(startedAt ? performance.now() - startedAt : 0);
      reset();
    }
  }, [typed, target, phase, startedAt, reset]);

  const correctCount = errors.filter((e, i) => !e && target[i] !== " ").length;
  const incorrectCount = errors.filter((e) => e).length;
  const totalChars = typed.replace(/\s/g, "").length;
  const wpm = useMemo(() => calcWpm(correctCount, elapsedMs || 1), [correctCount, elapsedMs]);
  const acc = calcAccuracy(correctCount, totalChars);

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-5xl mx-auto px-4">
      <ModeBar settings={settings} onChange={patchSettings} onOpenSettings={() => setSettingsOpen(true)} />

      {phase !== "done" ? (
        <>
          <div className="min-h-[10rem] w-full flex items-center justify-center">
            <MorsePrompt
              target={target}
              typed={typed}
              errors={errors}
              showHints={settings.showHints || settings.mode === "learn"}
              currentMorse={currentMorse}
            />
          </div>
          <StatsBar
            wpm={wpm}
            acc={acc}
            elapsedMs={elapsedMs}
            total={target.length}
            typed={typed.length}
            active={phase === "running"}
          />
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
  const left =
    scheme === "paddle" ? "space — tap = dit · hold = dah" :
    scheme === "two_key" ? "J = dit · K = dah" :
    ". = dit · - = dah";
  const right = gapMode === "auto"
    ? "auto-timing (3u letter · 7u word)"
    : "space = letter · enter = word";
  return (
    <div className="text-(--color-sub) text-xs flex flex-wrap justify-center gap-x-6 gap-y-1">
      <span>{left}</span>
      <span>{right}</span>
      <span>tab + enter — restart · esc — settings</span>
    </div>
  );
}
