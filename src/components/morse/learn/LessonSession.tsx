import { useEffect, useMemo, useRef, useState } from "react";
import type { Settings } from "@/lib/morse/storage";
import {
  type CourseState,
  type SessionSummary,
  recordRecognition,
  recordSend,
  applySessionResult,
  introduceNextChar,
  unlockedChars,
} from "@/lib/morse/progress";
import type { Activity, Session } from "@/lib/morse/lessonEngine";
import { lessonFor } from "@/lib/morse/curriculum";
import { MORSE } from "@/lib/morse/alphabet";
import { useMorseInput } from "@/lib/morse/useMorseInput";
import { withViewTransition } from "@/lib/morse/viewTransition";
import { useMorseAudio, speak } from "./useMorseAudio";
import { MnemonicCard } from "./MnemonicCard";
import { DitDahRow } from "./DitDahRow";
import { FocusRail } from "./FocusRail";
import { InputVisualizer } from "../InputVisualizer";
import { Button } from "@/components/ui/button";
import { Volume2, RotateCcw, Eye, X, Flame, Check } from "lucide-react";

/** Stable callback wrapper — always invokes the latest closure. */
function useStableCb<A extends unknown[], R>(fn: (...a: A) => R): (...a: A) => R {
  const ref = useRef(fn);
  ref.current = fn;

  return useMemo(
    () =>
      (...a: A) =>
        ref.current(...a),
    [],
  );
}

// ── shared types ───────────────────────────────────────────────────────────

type Graded = { ch: string; correct: boolean };
interface ActivityOutcome {
  graded: Graded[];
  checkpointPassed?: boolean;
  headCopyWpm?: number;
}
interface ACtx {
  course: CourseState;
  settings: Settings;
  audio: ReturnType<typeof useMorseAudio>;
  kidMode: boolean;
  speechHints: boolean;
}

const FEEDBACK_MS = 1100;

function normalizeKey(k: string): string | null {
  if (k.length !== 1) return null;
  const up = k.toUpperCase();
  return /[A-Z0-9.,?/=]/.test(up) ? up : null;
}
function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
// Build `n` wrong-answer choices. Only `ch` is ever *played*, so it's fine to
// pad the choice buttons with characters that aren't unlocked yet — better than
// a trivial two-option pick when you've only learned a couple of letters.
const ALL_CHOICE_POOL = "EISHTMOAUVRWLFKPXJYGZQNDBC0123456789".split("");
function distractors(ch: string, ctx: ACtx, n = 3): string[] {
  const out: string[] = [];
  const push = (c: string) => {
    if (c !== ch && lessonFor(c) && !out.includes(c)) out.push(c);
  };
  const unlocked = unlockedChars(ctx.course);
  const conf = lessonFor(ch)?.confuse ?? [];
  shuffle(conf.filter((c) => unlocked.includes(c))).forEach(push); // unlocked confusables first
  shuffle(unlocked).forEach(push); // then anything else you've learned
  shuffle(conf).forEach(push); // then confusables you haven't met yet
  shuffle(ALL_CHOICE_POOL).forEach(push); // then anything, just to fill the grid
  return out.slice(0, n);
}

// ── INTRO ──────────────────────────────────────────────────────────────────

function IntroActivity({
  ch,
  ctx,
  onDone,
}: {
  ch: string;
  ctx: ACtx;
  onDone: (o: ActivityOutcome) => void;
}) {
  const playedRef = useRef(false);
  useEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    const t = window.setTimeout(() => {
      ctx.audio.playChar(ch);
      if (ctx.speechHints) window.setTimeout(() => speak(lessonFor(ch)?.word ?? ch), 700);
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ch]);
  return (
    <div className="flex flex-col items-center gap-7">
      <div className="text-(--color-sub-faint) text-[11px] lowercase tracking-[0.15em]">
        new character
      </div>
      <MnemonicCard
        ch={ch}
        level="full"
        playing={ctx.audio.playing}
        symbolIndex={ctx.audio.symbolIndex}
        onPlay={() => ctx.audio.playChar(ch)}
        className="learn-intro-card"
      />
      <Button
        autoFocus
        onClick={() => onDone({ graded: [] })}
        className="bg-(--color-main) text-(--primary-foreground) hover:bg-(--color-main)/90"
      >
        got it — let's drill it →
      </Button>
    </div>
  );
}

// ── RECOGNIZE (hear it → name it) ──────────────────────────────────────────

function RecognizeActivity({
  ch,
  ctx,
  onDone,
}: {
  ch: string;
  ctx: ACtx;
  onDone: (o: ActivityOutcome) => void;
}) {
  const [answered, setAnswered] = useState<null | { picked: string; correct: boolean }>(null);
  const [showOptions, setShowOptions] = useState(ctx.kidMode);
  const [peek, setPeek] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const opts = useMemo(() => shuffle([ch, ...distractors(ch, ctx, 3)]), [ch]);
  const playedRef = useRef(false);
  useEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    const t = window.setTimeout(() => ctx.audio.playChar(ch), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ch]);

  const submit = useStableCb((picked: string) => {
    if (answered) return;
    const correct = picked.toUpperCase() === ch.toUpperCase();
    // morph the speaker prompt into the revealed letter
    withViewTransition(() => setAnswered({ picked: picked.toUpperCase(), correct }));
    if (!correct) window.setTimeout(() => ctx.audio.playChar(ch), 250);
    window.setTimeout(
      () => onDone({ graded: [{ ch: ch.toUpperCase(), correct }] }),
      FEEDBACK_MS + (correct ? 0 : 500),
    );
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (answered || e.metaKey || e.ctrlKey || e.altKey || e.key === "Tab") return;
      const k = normalizeKey(e.key);
      if (k) {
        e.preventDefault();
        submit(k);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, submit]);

  const L = lessonFor(ch);
  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-md">
      <div className="text-(--color-sub-faint) text-[11px] lowercase tracking-[0.15em]">
        what did you hear?
      </div>
      <div className="flex flex-col items-center gap-4">
        {answered ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="font-mono text-5xl font-semibold leading-none learn-answer-glyph"
              style={
                {
                  color: answered.correct ? "var(--color-success)" : "var(--color-error)",
                  viewTransitionName: "recog-focus",
                } as React.CSSProperties
              }
            >
              {ch}
            </div>
            <DitDahRow code={MORSE[ch] ?? ""} size="md" matchedCount={(MORSE[ch] ?? "").length} />
            <div className="text-[12px] text-(--color-sub-strong) animate-in fade-in duration-300">
              {answered.correct
                ? "spot on"
                : `you pressed “${answered.picked}” — it was “${ch}” (${L?.word})`}
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => ctx.audio.playChar(ch)}
              className="flex items-center justify-center size-20 rounded-full transition-transform active:scale-95"
              style={
                {
                  background: ctx.audio.playing
                    ? "var(--color-main-soft)"
                    : "var(--color-surface-1)",
                  border: "1px solid var(--color-main-border)",
                  boxShadow: ctx.audio.playing ? "0 0 30px -6px var(--color-main)" : "none",
                  viewTransitionName: "recog-focus",
                } as React.CSSProperties
              }
              aria-label="replay sound"
            >
              <Volume2 className="size-7 text-(--color-main)" />
            </button>
            <div className="font-mono text-2xl text-(--color-sub-faint) leading-none select-none">
              ?
            </div>
          </>
        )}
      </div>

      {!answered && (
        <>
          {showOptions ? (
            <div
              className={`grid ${ctx.kidMode ? "grid-cols-2 gap-3" : "grid-cols-4 gap-2"} w-full`}
            >
              {opts.map((o) => (
                <button
                  key={o}
                  onClick={() => submit(o)}
                  className={`rounded-xl font-mono ${ctx.kidMode ? "text-3xl py-6" : "text-xl py-3"} transition-colors hover:bg-(--color-main-soft)`}
                  style={{
                    background: "var(--color-surface-1)",
                    border: "1px solid var(--color-hairline)",
                    color: "var(--color-text)",
                  }}
                >
                  {o}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-(--color-sub-faint) text-[12px] lowercase tracking-wide">
              press the letter you heard
            </div>
          )}
          <div className="flex items-center gap-4 text-[11px] lowercase tracking-wide text-(--color-sub-faint)">
            {!ctx.kidMode && (
              <button
                className="hover:text-(--color-sub) underline underline-offset-4"
                onClick={() => setShowOptions((v) => !v)}
              >
                {showOptions ? "hide options" : "show options"}
              </button>
            )}
            <button
              className="hover:text-(--color-sub) underline underline-offset-4 inline-flex items-center gap-1"
              onClick={() => setPeek((v) => !v)}
            >
              <Eye className="size-3" />
              {peek ? "hide hint" : "peek"}
            </button>
          </div>
          {peek && (
            <MnemonicCard
              ch={ch}
              level="fading"
              playing={ctx.audio.playing}
              symbolIndex={ctx.audio.symbolIndex}
              onPlay={() => ctx.audio.playChar(ch)}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── SEND (see it → key it) ─────────────────────────────────────────────────

function SendActivity({
  ch,
  ctx,
  onDone,
}: {
  ch: string;
  ctx: ACtx;
  onDone: (o: ActivityOutcome) => void;
}) {
  const [answered, setAnswered] = useState<null | { ok: boolean }>(null);
  const [invalidAt, setInvalidAt] = useState<number | null>(null);
  const unitMs = Math.round(1200 / ctx.course.characterWpm);
  const target = ch.toUpperCase();
  const targetCode = MORSE[target] ?? "";

  const handleChar = useStableCb((decoded: string) => {
    if (answered || decoded === " ") return;
    const ok = decoded.toUpperCase() === target;
    setAnswered({ ok });
    if (!ok) window.setTimeout(() => ctx.audio.playChar(target), 250);
    window.setTimeout(
      () => onDone({ graded: [{ ch: target, correct: ok }] }),
      FEEDBACK_MS + (ok ? 0 : 600),
    );
  });

  const { currentMorse, lastSymbolAt, pressStartAt } = useMorseInput({
    scheme: ctx.settings.scheme,
    gapMode: "auto",
    unitMs,
    audio: true,
    pitchHz: ctx.settings.pitchHz,
    audioMode: ctx.settings.audioMode,
    waveform: ctx.settings.waveform,
    vintage: ctx.settings.vintage,
    enabled: !answered,
    onChar: handleChar,
    onInvalid: () => setInvalidAt(performance.now()),
  });

  let matched = 0;
  while (matched < currentMorse.length && currentMorse[matched] === targetCode[matched]) matched++;
  const schemeHint =
    ctx.settings.scheme === "paddle"
      ? "spacebar — tap = dit, hold = dah"
      : ctx.settings.scheme === "two_key"
        ? "j = dit · k = dah"
        : ". = dit · - = dah";

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <div className="text-(--color-sub-faint) text-[11px] lowercase tracking-[0.15em]">
        key this character
      </div>
      <div className="flex flex-col items-center gap-3">
        <div
          className="font-mono text-6xl font-semibold leading-none"
          style={{
            color: answered
              ? answered.ok
                ? "var(--color-success)"
                : "var(--color-error)"
              : "var(--color-text)",
          }}
        >
          {target}
        </div>
        <DitDahRow
          code={targetCode}
          size="md"
          matchedCount={answered ? targetCode.length : matched}
        />
      </div>
      <InputVisualizer
        currentInput={currentMorse}
        targetMorse={targetCode}
        lastSymbolAt={lastSymbolAt}
        pressStartAt={pressStartAt}
        unitMs={unitMs}
        gapMode="auto"
        scheme={ctx.settings.scheme}
        invalidAt={invalidAt}
        showHints={true}
      />
      {answered ? (
        <div className="text-[12px] text-(--color-sub-strong) animate-in fade-in duration-200">
          {answered.ok
            ? "clean copy"
            : `that decoded as something else — ${target} is ${targetCode}`}
        </div>
      ) : (
        <div className="flex items-center gap-4 text-[11px] lowercase tracking-wide text-(--color-sub-faint)">
          <span>{schemeHint}</span>
          <button
            className="hover:text-(--color-sub) underline underline-offset-4 inline-flex items-center gap-1"
            onClick={() => ctx.audio.playChar(target)}
          >
            <Volume2 className="size-3" />
            hear it
          </button>
        </div>
      )}
    </div>
  );
}

// ── WORD COPY / HEAD COPY / CHECKPOINT (hear text → type it) ───────────────

function WordCopyActivity({
  text,
  ctx,
  onDone,
  headCopy = false,
  checkpoint = false,
}: {
  text: string;
  ctx: ACtx;
  onDone: (o: ActivityOutcome) => void;
  headCopy?: boolean;
  checkpoint?: boolean;
}) {
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"playing" | "input" | "graded">(
    headCopy ? "playing" : "input",
  );
  const [graded, setGraded] = useState<{ correct: number; total: number } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const playedRef = useRef(false);
  const target = text;

  const playIt = useStableCb(() => {
    if (headCopy) setPhase("playing");
    ctx.audio.playText(target, {
      farnsworth: true,
      onDone: () => {
        if (headCopy) {
          setPhase("input");
          window.setTimeout(() => inputRef.current?.focus(), 30);
        }
      },
    });
  });
  useEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    const t = window.setTimeout(() => playIt(), 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (phase === "input" && !headCopy) inputRef.current?.focus();
  }, [phase, headCopy]);

  const finish = useStableCb((finalTyped: string) => {
    if (graded) return;
    ctx.audio.stop();
    const t = [...target],
      u = [...finalTyped];
    const g: Graded[] = [];
    let correctCount = 0,
      total = 0;
    for (let i = 0; i < t.length; i++) {
      if (t[i] === " ") continue;
      total++;
      const ok = (u[i] ?? "").toLowerCase() === t[i].toLowerCase();
      if (ok) correctCount++;
      if (lessonFor(t[i])) g.push({ ch: t[i].toUpperCase(), correct: ok });
    }
    const acc = total === 0 ? 1 : correctCount / total;
    setGraded({ correct: correctCount, total });
    setPhase("graded");
    onDoneAfter(
      g,
      checkpoint ? acc >= 0.8 : undefined,
      headCopy && acc >= 0.8 ? ctx.course.effectiveWpm : undefined,
    );
  });
  const onDoneAfter = (g: Graded[], cp?: boolean, hc?: number) => {
    window.setTimeout(
      () => onDone({ graded: g, checkpointPassed: cp, headCopyWpm: hc }),
      checkpoint ? 2200 : 1700,
    );
  };

  function onChange(v: string) {
    setTyped(v);
    if (v.replace(/\s+$/g, "").length >= target.length) window.setTimeout(() => finish(v), 120);
  }

  const label = headCopy
    ? "listen, then type the whole word from memory"
    : checkpoint
      ? "📻 incoming transmission — copy it"
      : "type what you hear";
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg">
      <div className="text-(--color-sub-faint) text-[11px] lowercase tracking-[0.15em]">
        {label}
      </div>
      <button
        onClick={() => playIt()}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-transform active:scale-95"
        style={{
          background: ctx.audio.playing ? "var(--color-main-soft)" : "var(--color-surface-1)",
          border: "1px solid var(--color-main-border)",
          boxShadow: ctx.audio.playing ? "0 0 24px -6px var(--color-main)" : "none",
        }}
      >
        {ctx.audio.playing ? (
          <Volume2 className="size-5 text-(--color-main) animate-pulse" />
        ) : (
          <RotateCcw className="size-5 text-(--color-main)" />
        )}
        <span className="text-[12px] text-(--color-sub-strong) lowercase tracking-wide">
          {ctx.audio.playing ? "sending…" : "replay"}
        </span>
      </button>

      {phase === "playing" ? (
        <div className="h-12 flex items-center text-(--color-sub-faint) text-sm lowercase tracking-wide">
          listening… (don't type yet)
        </div>
      ) : (
        <input
          ref={inputRef}
          value={typed}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              finish(typed);
            }
          }}
          disabled={phase === "graded"}
          spellCheck={false}
          autoComplete="off"
          className="w-full text-center font-mono text-2xl tracking-[0.2em] lowercase bg-transparent border-b-2 border-(--color-hairline) focus:border-(--color-main) outline-none py-2 text-(--color-text)"
          placeholder={target.replace(/[^ ]/g, "·")}
        />
      )}

      {phase === "graded" && graded && (
        <div className="flex flex-col items-center gap-2 animate-in fade-in duration-200">
          <div className="font-mono text-xl tracking-[0.15em] lowercase">
            {[...target].map((tc, i) =>
              tc === " " ? (
                <span key={i}>&nbsp;&nbsp;</span>
              ) : (
                <span
                  key={i}
                  style={{
                    color:
                      ([...typed][i] ?? "").toLowerCase() === tc.toLowerCase()
                        ? "var(--color-success)"
                        : "var(--color-error)",
                  }}
                >
                  {tc}
                </span>
              ),
            )}
          </div>
          <div className="text-[12px] text-(--color-sub-strong)">
            {graded.correct}/{graded.total} correct
            {checkpoint
              ? graded.correct / Math.max(1, graded.total) >= 0.8
                ? " — checkpoint cleared ✓"
                : " — keep at it"
              : ""}
          </div>
        </div>
      )}

      {phase !== "graded" && (
        <button
          className="text-(--color-sub-faint) text-[11px] lowercase tracking-wide hover:text-(--color-sub) underline underline-offset-4"
          onClick={() => finish(typed)}
        >
          i'm done — check it
        </button>
      )}
    </div>
  );
}

// ── SESSION RUNNER ─────────────────────────────────────────────────────────

interface Props {
  session: Session;
  course: CourseState;
  settings: Settings;
  speechHints?: boolean;
  onExit: (course: CourseState) => void;
  onComplete: (course: CourseState, summary: SessionSummary, again: boolean) => void;
}

export function LessonSession({
  session,
  course: initialCourse,
  settings,
  speechHints = false,
  onExit,
  onComplete,
}: Props) {
  const [course, setCourse] = useState(initialCourse);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef(performance.now());
  const audio = useMorseAudio(settings, initialCourse.characterWpm, initialCourse.effectiveWpm);

  // mutable accumulators (avoid stale-closure on batched setState)
  const resultsRef = useRef<boolean[]>([]);
  const cpRef = useRef(false);
  const hcRef = useRef(0);
  const courseRef = useRef(course);
  courseRef.current = course;

  const ctx: ACtx = { course, settings, audio, kidMode: course.kidMode, speechHints };
  const act = session.activities[idx];
  const total = session.activities.length;

  const buildSummary = (): SessionSummary => ({
    accuracy: resultsRef.current.length
      ? resultsRef.current.filter(Boolean).length / resultsRef.current.length
      : 1,
    minutes: (performance.now() - startedAt.current) / 60000,
    introduced: session.introducedThisSession,
    checkpointPassed: cpRef.current || undefined,
    headCopyWpm: hcRef.current || undefined,
  });

  const handleDone = useStableCb((o: ActivityOutcome) => {
    if (act.kind === "intro") {
      // unlocking happens here, not at build time — exiting before the intro
      // means the character stays locked.
      const next = introduceNextChar(courseRef.current);
      courseRef.current = next;
      setCourse(next);
    }
    if (o.graded.length) {
      let next = courseRef.current;
      for (const g of o.graded)
        next =
          act.kind === "send"
            ? recordSend(next, g.ch, g.correct)
            : recordRecognition(next, g.ch, g.correct);
      resultsRef.current = [...resultsRef.current, ...o.graded.map((g) => g.correct)];
      courseRef.current = next;
      setCourse(next);
    }
    if (o.checkpointPassed) cpRef.current = true;
    if (o.headCopyWpm) hcRef.current = Math.max(hcRef.current, o.headCopyWpm);

    if (idx + 1 >= total) {
      audio.stop();
      const finalC = applySessionResult(courseRef.current, buildSummary());
      courseRef.current = finalC;
      withViewTransition(() => {
        setCourse(finalC);
        setDone(true);
      });
    } else {
      setIdx((i) => i + 1);
    }
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        audio.stop();
        onExit(courseRef.current);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) {
    return (
      <DoneScreen
        course={course}
        prevCourse={initialCourse}
        results={resultsRef.current}
        session={session}
        onAgain={() => onComplete(courseRef.current, buildSummary(), true)}
        onHome={() => onComplete(courseRef.current, buildSummary(), false)}
      />
    );
  }

  const activeChar = "ch" in act ? act.ch.toUpperCase() : null;

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-8">
      <div className="w-full flex items-center gap-4">
        <button
          onClick={() => {
            audio.stop();
            onExit(courseRef.current);
          }}
          className="text-(--color-sub-faint) hover:text-(--color-sub) inline-flex items-center gap-1 text-[12px] lowercase tracking-wide shrink-0"
        >
          <X className="size-3.5" /> exit
        </button>
        <div className="flex-1 flex justify-center">
          <FocusRail
            chars={session.focusChars}
            activeChar={activeChar}
            course={course}
            progress={idx / total}
          />
        </div>
        <div className="text-(--color-sub-faint) text-[11px] tabular-nums tracking-wide shrink-0">
          {idx + 1} / {total}
        </div>
      </div>
      <div className="w-full flex items-center justify-center min-h-[18rem]">
        {act.kind === "intro" && (
          <IntroActivity key={idx} ch={act.ch} ctx={ctx} onDone={handleDone} />
        )}
        {act.kind === "recognize" && (
          <RecognizeActivity key={idx} ch={act.ch} ctx={ctx} onDone={handleDone} />
        )}
        {act.kind === "send" && (
          <SendActivity key={idx} ch={act.ch} ctx={ctx} onDone={handleDone} />
        )}
        {act.kind === "copyWord" && (
          <WordCopyActivity key={idx} text={act.word} ctx={ctx} onDone={handleDone} />
        )}
        {act.kind === "headCopy" && (
          <WordCopyActivity key={idx} text={act.word} ctx={ctx} onDone={handleDone} headCopy />
        )}
        {act.kind === "checkpoint" && (
          <WordCopyActivity key={idx} text={act.text} ctx={ctx} onDone={handleDone} checkpoint />
        )}
      </div>
    </div>
  );
}

// ── DONE SCREEN ────────────────────────────────────────────────────────────

function DoneScreen({
  course,
  prevCourse,
  results,
  session,
  onAgain,
  onHome,
}: {
  course: CourseState;
  prevCourse: CourseState;
  results: boolean[];
  session: Session;
  onAgain: () => void;
  onHome: () => void;
}) {
  const acc = results.length
    ? Math.round((results.filter(Boolean).length / results.length) * 100)
    : 100;
  const speedUp = course.effectiveWpm > prevCourse.effectiveWpm;
  const accColor =
    acc >= 95 ? "var(--color-success)" : acc >= 85 ? "var(--color-main)" : "var(--color-error)";
  return (
    <div className="w-full max-w-md flex flex-col items-center gap-7">
      <div
        className="w-full px-8 py-7 rounded-2xl text-center"
        style={{
          background: "var(--color-main-soft)",
          border: "1px solid var(--color-main-border)",
        }}
      >
        <div className="text-sm text-(--color-sub-strong) mb-4 lowercase tracking-wide">
          session complete
        </div>
        <div className="flex justify-center gap-x-10 gap-y-4 flex-wrap mb-4">
          <div>
            <div className="stat-value" style={{ color: accColor }}>
              {acc}%
            </div>
            <div className="stat-label">accuracy</div>
          </div>
          <div>
            <div className="stat-value text-(--color-text)">{results.length}</div>
            <div className="stat-label">drills</div>
          </div>
          <div>
            <div className="stat-value text-(--color-text)">{course.effectiveWpm}</div>
            <div className="stat-label">copy wpm</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-[12px] text-(--color-sub-strong)">
          <Flame className="size-3.5 text-(--color-main)" /> {course.streakDays} day streak
        </div>
      </div>

      {session.introducedThisSession.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-[11px] text-(--color-sub-faint) lowercase tracking-wide">
            new in your alphabet
          </div>
          <div className="flex gap-2">
            {session.introducedThisSession.map((ch) => (
              <div
                key={ch}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg"
                style={{
                  background: "var(--color-surface-1)",
                  border: "1px solid var(--color-hairline)",
                }}
              >
                <span className="font-mono text-xl text-(--color-text)">{ch}</span>
                <DitDahRow code={MORSE[ch] ?? ""} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
      {course.streakDays > prevCourse.streakDays && session.introducedThisSession.length === 0 && (
        <div className="text-[12px] text-(--color-sub-strong) inline-flex items-center gap-1.5">
          <Check className="size-3.5 text-(--color-success)" /> kept the streak alive — short and
          frequent wins
        </div>
      )}
      {speedUp && (
        <div className="text-[12px] text-(--color-sub-strong) inline-flex items-center gap-1.5">
          <Check className="size-3.5 text-(--color-success)" /> spacing tightened — copy speed up to{" "}
          {course.effectiveWpm} wpm
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          onClick={onAgain}
          className="bg-(--color-main) text-(--primary-foreground) hover:bg-(--color-main)/90"
        >
          another session →
        </Button>
        <Button
          variant="ghost"
          onClick={onHome}
          className="text-(--color-sub) hover:text-(--color-text) text-xs lowercase tracking-wide"
        >
          back to map
        </Button>
      </div>
    </div>
  );
}
