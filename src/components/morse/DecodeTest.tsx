import { useEffect, useMemo, useRef, useState } from "react";
import { ModeBar } from "./ModeBar";
import { StatsBar } from "./StatsBar";
import { Results } from "./Results";
import { SettingsDialog } from "./SettingsDialog";
import { TransmissionLog } from "./TransmissionLog";
import { Scope } from "./Scope";
import { MorseStream } from "./MorseStream";
import { generate } from "@/lib/morse/content";
import { calcAccuracy, calcWpm } from "@/lib/morse/wpm";
import { loadSettings, saveSettings, type Settings } from "@/lib/morse/storage";
import { useApplyTheme } from "@/hooks/use-theme";
import { play, type Playback } from "@/lib/morse/player";
import { MORSE } from "@/lib/morse/alphabet";
import { Switch } from "@/components/ui/switch";
import { Play, Pause, RotateCcw } from "lucide-react";

function withViewTransition(fn: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (typeof doc.startViewTransition === "function") {
    doc.startViewTransition(fn);
  } else {
    fn();
  }
}

type Phase = "idle" | "running" | "done";

export function DecodeTest() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  useApplyTheme(settings.theme);
  const [target, setTarget] = useState(() => generate(settings.content, settings.wordCount));
  const [typed, setTyped] = useState("");
  const [errors, setErrors] = useState<boolean[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [revealed, setRevealed] = useState<{ symbols: string; correct: boolean }[]>([]);
  const [pulse, setPulse] = useState(false);
  const [paused, setPaused] = useState(false);
  const [flash, setFlash] = useState<{ idx: number; ok: boolean; nonce: number } | null>(null);
  const [currentLetter, setCurrentLetter] = useState<{ symbols: string; complete: boolean }>({
    symbols: "",
    complete: false,
  });

  const playbackRef = useRef<Playback | null>(null);
  const tickRef = useRef<number | null>(null);
  const promptRef = useRef<HTMLDivElement | null>(null);

  // WAAPI: flash the just-typed char + (on error) shake the prompt.
  useEffect(() => {
    if (!flash) return;
    const root = promptRef.current;
    if (!root) return;
    const chars = root.querySelectorAll<HTMLSpanElement>(".decode-char");
    const el = chars[flash.idx];
    if (el) {
      el.animate(
        flash.ok
          ? [
              {
                transform: "scale(1)",
                color: "var(--color-main)",
                textShadow: "0 0 0 transparent",
                offset: 0,
              },
              {
                transform: "scale(1.22)",
                color: "var(--color-main)",
                textShadow: "0 0 12px var(--color-main)",
                offset: 0.35,
              },
              {
                transform: "scale(1)",
                color: "var(--color-sub-strong)",
                textShadow: "0 0 0 transparent",
                offset: 1,
              },
            ]
          : [
              {
                transform: "scale(1) translateX(0)",
                color: "var(--color-error)",
                textShadow: "0 0 0 transparent",
                offset: 0,
              },
              {
                transform: "scale(1.08) translateX(3px)",
                color: "var(--color-error)",
                textShadow: "0 0 14px var(--color-error)",
                offset: 0.25,
              },
              { transform: "translateX(-3px)", color: "var(--color-error)", offset: 0.6 },
              { transform: "scale(1) translateX(0)", color: "var(--color-error)", offset: 1 },
            ],
        {
          duration: flash.ok ? 260 : 280,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards",
        },
      );
    }
    if (!flash.ok) {
      root.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-3px)" },
          { transform: "translateX(3px)" },
          { transform: "translateX(-2px)" },
          { transform: "translateX(2px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 220, easing: "cubic-bezier(0.36, 0.07, 0.19, 0.97)" },
      );
    }
  }, [flash]);

  function patchSettings(patch: Partial<Settings>) {
    setSettings((s) => {
      const next = { ...s, ...patch };
      saveSettings(next);
      return next;
    });
  }

  function startPlayback(text: string, audioOnForce?: boolean) {
    playbackRef.current?.stop();
    setPaused(false);
    playbackRef.current = play(text, {
      unitMs: settings.unitMs,
      farnsworth: settings.decodeFarnsworth,
      audio: audioOnForce ?? true,
      audioMode: settings.audioMode,
      pitchHz: settings.pitchHz,
      waveform: settings.waveform,
      vintage: settings.vintage,
      onSymbolStart: (sym) => {
        setPulse(true);
        window.setTimeout(() => setPulse(false), 80);
        setCurrentLetter((prev) =>
          prev.complete
            ? { symbols: sym, complete: false }
            : { symbols: prev.symbols + sym, complete: false },
        );
      },
      onLetterEnd: (ch) => {
        setCurrentLetter((prev) => ({ ...prev, complete: true }));
        if (ch === " ") return;
        const symbols = MORSE[ch.toUpperCase()] ?? "";
        if (!symbols) return;
        setRevealed((r) => [...r, { symbols, correct: true }]);
      },
    });
  }

  function restart(nextSettings = settings) {
    playbackRef.current?.stop();
    const t = generate(nextSettings.content, nextSettings.wordCount);
    setTarget(t);
    setTyped("");
    setErrors([]);
    setRevealed([]);
    setPhase("idle");
    setStartedAt(null);
    setElapsedMs(0);
    setFlash(null);
    setCurrentLetter({ symbols: "", complete: false });
  }

  // restart on content/length change
  useEffect(() => {
    restart(settings); /* eslint-disable-next-line */
  }, [settings.content, settings.wordCount]);
  useEffect(
    () => () => {
      playbackRef.current?.stop();
    },
    [],
  );

  // tick
  useEffect(() => {
    if (phase !== "running" || startedAt == null) return;
    tickRef.current = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt);
    }, 100);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [phase, startedAt]);

  // keyboard
  useEffect(() => {
    let tabPressed = false;
    function onKey(e: KeyboardEvent) {
      if (settingsOpen) {
        tabPressed = false;
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSettingsOpen(true);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        tabPressed = true;
        return;
      }
      if (e.key === "Enter" && tabPressed) {
        e.preventDefault();
        tabPressed = false;
        restart();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      tabPressed = false;
      if (phase === "done") return;

      if (e.key === "Backspace") {
        e.preventDefault();
        if (typed.length === 0) return;
        setTyped((s) => s.slice(0, -1));
        setErrors((er) => er.slice(0, -1));
        return;
      }
      // Accept printable chars (a-z, 0-9, space, punctuation)
      if (e.key.length !== 1) return;
      const ch = e.key;
      if (!/[a-z0-9 .,?!/=]/i.test(ch)) return;
      e.preventDefault();

      if (phase === "idle") {
        const t = performance.now();
        setStartedAt(t);
        setPhase("running");
        startPlayback(target);
      }
      const expected = target[typed.length];
      if (expected == null) return;
      const ok = ch.toLowerCase() === expected.toLowerCase();
      const idx = typed.length;
      setTyped((s) => s + ch);
      setErrors((er) => [...er, !ok]);
      setFlash((f) => ({ idx, ok, nonce: (f?.nonce ?? 0) + 1 }));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line
  }, [phase, typed, target, settingsOpen, settings]);

  // Reveal sent symbols on the paper tape as they play
  useEffect(() => {
    if (phase !== "running") return;
    // Append to revealed when playback emits letter ends
    // Hook by replacing onLetterEnd after start? Simpler: derive from typed length asynchronously is wrong.
    // We instead poll: on each pulse (symbol), nothing; on each letter typed, append.
    // (Tape just shows the sent stream a few letters ahead — but this is fine as it follows reveals via onLetterEnd in startPlayback.)
  }, [phase]);

  // completion
  useEffect(() => {
    if (phase === "running" && typed.length >= target.length) {
      const finalElapsed = startedAt ? performance.now() - startedAt : 0;
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      playbackRef.current?.stop();
      setElapsedMs(finalElapsed);
      setPhase("done");
    }
  }, [typed, target, phase, startedAt]);

  function togglePause() {
    const p = playbackRef.current;
    if (!p) return;
    withViewTransition(() => {
      if (paused) {
        p.resume();
        setPaused(false);
      } else {
        p.pause();
        setPaused(true);
      }
    });
  }

  const correctCount = errors.filter((e, i) => !e && target[i] !== " ").length;
  const incorrectCount = errors.filter((e) => e).length;
  const totalChars = typed.replace(/\s/g, "").length;
  const wpm = useMemo(() => calcWpm(correctCount, elapsedMs), [correctCount, elapsedMs]);
  const acc = calcAccuracy(correctCount, totalChars);

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center w-full max-w-3xl mx-auto px-8">
        <div className="mb-8">
          <ModeBar
            settings={settings}
            onChange={patchSettings}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </div>
        <Results
          wpm={wpm}
          acc={acc}
          elapsedMs={elapsedMs}
          correct={correctCount}
          incorrect={incorrectCount}
          settings={settings}
          onRestart={() => restart()}
        />
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          settings={settings}
          onChange={patchSettings}
        />
      </div>
    );
  }

  const audioOnly = settings.decodeAudioOnly;

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto px-8">
      <div className="mb-6">
        <ModeBar
          settings={settings}
          onChange={patchSettings}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      <div className="w-full mb-3 flex items-center justify-between text-[11px] text-(--color-sub-faint) lowercase tracking-wide">
        <span>receive · type what you hear</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <span>audio only</span>
          <Switch
            checked={settings.decodeAudioOnly}
            onCheckedChange={(b) => patchSettings({ decodeAudioOnly: b })}
          />
        </label>
      </div>

      {!audioOnly && <Scope active={phase === "running" && !paused} />}

      {!audioOnly && settings.showHints && (
        <MorseStream symbols={currentLetter.symbols} complete={currentLetter.complete} />
      )}

      <div
        ref={promptRef}
        className="decode-prompt w-full px-4 py-8 min-h-[7.5rem] text-center font-mono text-2xl tracking-wide"
        data-pulse={pulse ? "on" : "off"}
      >
        {target.split("").map((ch, i) => {
          const done = i < typed.length;
          const isCurrent = i === typed.length;
          const isError = done && errors[i];
          let color = "var(--color-sub-faint)";
          if (done) color = isError ? "var(--color-error)" : "var(--color-sub-strong)";
          else if (isCurrent) color = "var(--color-main)";
          return (
            <span
              key={i}
              className="decode-char"
              data-current={isCurrent ? "true" : undefined}
              data-ghost={!done && !isCurrent ? "true" : undefined}
              style={{ color, transition: "color 120ms ease" }}
            >
              {done
                ? typed[i] === " "
                  ? " "
                  : typed[i]
                : isCurrent
                  ? "_"
                  : ch === " "
                    ? "·"
                    : "·"}
            </span>
          );
        })}
        {phase === "idle" && typed.length === 0 && (
          <div className="decode-idle-hint">press play, then type the letters you hear</div>
        )}
      </div>

      <div className="w-full mt-4">
        <StatsBar
          wpm={wpm}
          acc={acc}
          elapsedMs={elapsedMs}
          total={target.length}
          typed={typed.length}
          active={phase === "running"}
          streak={0}
        />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          className="pill"
          style={{ viewTransitionName: "decode-play-btn" }}
          onClick={() => {
            if (phase === "idle") {
              withViewTransition(() => {
                setStartedAt(performance.now());
                setPhase("running");
                startPlayback(target);
              });
            } else {
              togglePause();
            }
          }}
        >
          {phase === "idle" ? (
            <span key="idle">
              <Play className="size-3.5 inline-block" /> play
            </span>
          ) : paused ? (
            <span key="paused">
              <Play className="size-3.5 inline-block" /> resume
            </span>
          ) : (
            <span key="playing">
              <Pause className="size-3.5 inline-block" /> pause
            </span>
          )}
        </button>
        <button
          className="pill"
          disabled={phase !== "running"}
          onClick={() => {
            withViewTransition(() => playbackRef.current?.replayLastWord());
          }}
          title="replay last word"
        >
          <RotateCcw className="size-3.5" /> replay word
        </button>
      </div>

      {!audioOnly && <TransmissionLog letters={revealed} current="" />}

      <div
        className="decode-vignette"
        data-active={phase === "running" && !paused ? "on" : "off"}
        aria-hidden
      />
      <div className="decode-pulse-ring" data-pulse={pulse ? "on" : "off"} aria-hidden />

      <div className="mt-6 text-[11px] text-(--color-sub-faint) flex flex-wrap justify-center gap-x-5 gap-y-1 lowercase tracking-wide">
        <span>
          <span className="text-(--color-sub) font-medium">type</span> = decode characters
        </span>
        <span>
          <span className="text-(--color-sub) font-medium">tab</span> +{" "}
          <span className="text-(--color-sub) font-medium">enter</span> = restart
        </span>
        <span>
          <span className="text-(--color-sub) font-medium">esc</span> = settings
        </span>
      </div>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onChange={patchSettings}
      />
    </div>
  );
}
