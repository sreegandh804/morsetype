import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Header } from "@/components/morse/Header";
import { MORSE } from "@/lib/morse/alphabet";
import {
  alphabetScores,
  loadMistakes,
  overallStats,
  resetMistakes,
  weakChars,
  MASTERY,
  type CharScore,
} from "@/lib/morse/mistakes";
import { loadSettings, saveSettings } from "@/lib/morse/storage";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learning Mode — MorseType" },
      {
        name: "description",
        content:
          "Track your Morse code mistakes, see which letters need work, and run targeted drills on your weakest characters.",
      },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  const navigate = useNavigate();
  // Re-render trigger after reset / drill-start.
  const [tick, setTick] = useState(0);
  const store = useMemo(() => loadMistakes(), [tick]);
  const stats = useMemo(() => overallStats(store), [store]);
  const scores = useMemo(() => alphabetScores(store), [store]);
  const weak = useMemo(() => weakChars(8, store), [store]);

  const letters = scores.filter((s) => /^[A-Z]$/.test(s.char));
  const numbers = scores.filter((s) => /^[0-9]$/.test(s.char));
  const masteryPct = stats.total
    ? Math.round((stats.mastered / stats.total) * 100)
    : 0;

  function startDrill() {
    const s = loadSettings();
    saveSettings({ ...s, content: "drill", mode: "learn", showHints: true });
    navigate({ to: "/" });
  }

  function onReset() {
    if (typeof window !== "undefined" && !window.confirm("Reset all learning progress?")) return;
    resetMistakes();
    setTick((t) => t + 1);
  }

  const hasData = stats.totalAttempts > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-8 py-10 space-y-10">
        <section>
          <h1 className="font-mono text-2xl tracking-tight mb-1.5">
            <span className="text-(--color-text)">learning </span>
            <span className="text-(--color-main)">mode</span>
          </h1>
          <p className="text-(--color-sub-strong) text-sm leading-relaxed max-w-2xl">
            Every test feeds into your profile here. Letters you miss surface
            below, and the drill mode practices them in proportion to how often
            you mistype them.
          </p>
        </section>

        <SummaryCard
          mastered={stats.mastered}
          total={stats.total}
          masteryPct={masteryPct}
          accuracy={stats.accuracy}
          sessions={stats.sessions}
          attempts={stats.totalAttempts}
        />

        {!hasData && (
          <div className="text-(--color-sub) text-sm border border-dashed border-(--color-border) rounded-lg px-5 py-6 text-center">
            no practice data yet — finish a test on the{" "}
            <a href="/" className="text-(--color-main) hover:underline">
              practice page
            </a>{" "}
            and your trouble letters will show up here.
          </div>
        )}

        <section className="space-y-4">
          <SectionHeader
            title="trouble letters"
            hint={
              weak.length
                ? "weighted by how often you miss them"
                : "no mistakes recorded yet"
            }
          />
          {weak.length > 0 ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-2">
                {weak.map((w) => (
                  <TroubleChip key={w.char} score={w} />
                ))}
              </div>
              <button
                onClick={startDrill}
                className="self-start px-4 py-2 rounded-md text-sm font-medium bg-(--color-main) text-(--primary-foreground) hover:bg-(--color-main)/90 transition-colors lowercase tracking-wide"
              >
                practice these →
              </button>
            </div>
          ) : (
            <p className="text-(--color-sub-faint) text-sm">
              {hasData
                ? "clean slate — no errors recorded. nice."
                : "—"}
            </p>
          )}
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="alphabet mastery"
            hint="brighter = stronger · red dot = recent errors"
          />
          <HeatmapGrid scores={letters} />
        </section>

        <section className="space-y-4">
          <SectionHeader title="numbers" hint="" />
          <HeatmapGrid scores={numbers} />
        </section>

        {hasData && (
          <div className="pt-2">
            <button
              onClick={onReset}
              className="text-(--color-sub-faint) hover:text-(--color-error) text-[11px] lowercase tracking-wide transition-colors"
            >
              reset progress
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function SectionHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="font-mono text-base text-(--color-main) lowercase tracking-tight">
        {title}
      </h2>
      {hint && (
        <span className="text-(--color-sub-faint) text-[11px] lowercase tracking-wide">
          {hint}
        </span>
      )}
    </div>
  );
}

function SummaryCard({
  mastered,
  total,
  masteryPct,
  accuracy,
  sessions,
  attempts,
}: {
  mastered: number;
  total: number;
  masteryPct: number;
  accuracy: number;
  sessions: number;
  attempts: number;
}) {
  return (
    <div
      className="rounded-xl px-7 py-6"
      style={{
        background: "rgba(240, 180, 41, 0.04)",
        border: "1px solid rgba(240, 180, 41, 0.12)",
      }}
    >
      <div className="flex flex-wrap items-end gap-x-12 gap-y-5">
        <SummaryStat
          label="mastered"
          value={`${mastered}/${total}`}
          accent
        />
        <SummaryStat
          label="accuracy"
          value={`${attempts ? Math.round(accuracy) : 0}%`}
        />
        <SummaryStat label="sessions" value={sessions.toString()} />
        <SummaryStat label="chars typed" value={attempts.toString()} />
      </div>
      <div className="mt-5">
        <div className="h-1.5 w-full rounded-full overflow-hidden bg-white/[0.05]">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${masteryPct}%`,
              background: "var(--color-main)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="font-mono font-bold leading-none tracking-tight"
        style={{
          fontSize: accent ? "2rem" : "1.5rem",
          color: accent ? "var(--color-main)" : "var(--color-text)",
        }}
      >
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-[0.08em] text-(--color-sub-faint)">
        {label}
      </span>
    </div>
  );
}

function TroubleChip({ score }: { score: CharScore }) {
  const pct = Math.round(score.errorRate * 100);
  return (
    <span
      className="inline-flex items-baseline gap-2 pl-3 pr-2.5 py-1.5 rounded-md font-mono"
      style={{
        background: "rgba(224, 82, 82, 0.06)",
        border: "1px solid rgba(224, 82, 82, 0.18)",
      }}
    >
      <span className="text-(--color-text) text-base font-semibold leading-none">
        {score.char}
      </span>
      <span className="text-(--color-main) text-[11px] tracking-[2px] leading-none">
        {MORSE[score.char]}
      </span>
      <span className="text-(--color-error) text-[11px] leading-none">
        {pct}%
      </span>
    </span>
  );
}

function HeatmapGrid({ scores }: { scores: CharScore[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1.5">
      {scores.map((s) => (
        <HeatmapCell key={s.char} score={s} />
      ))}
    </div>
  );
}

function HeatmapCell({ score }: { score: CharScore }) {
  // Color: dim grey if untouched, mustard intensity scaling with mastery,
  // red border accent if there have been recent errors.
  const untouched = score.attempts === 0;
  const mastered = score.mastery >= MASTERY.threshold;
  const bg = untouched
    ? "rgba(255,255,255,0.02)"
    : `rgba(240, 180, 41, ${0.05 + score.mastery * 0.18})`;
  const border = mastered
    ? "rgba(240, 180, 41, 0.4)"
    : score.errors > 0
      ? "rgba(224, 82, 82, 0.25)"
      : "var(--hairline)";
  const charColor = untouched
    ? "var(--color-sub-faint)"
    : "var(--color-text)";

  return (
    <div
      className="relative flex flex-col items-center gap-1 px-2 py-2.5 rounded-md transition-colors"
      style={{ background: bg, border: `1px solid ${border}` }}
      title={
        untouched
          ? `${score.char} — not yet practiced`
          : `${score.char} — ${score.attempts} attempts · ${Math.round(
              score.errorRate * 100,
            )}% errors`
      }
    >
      <span
        className="font-mono text-base font-semibold leading-none"
        style={{ color: charColor }}
      >
        {score.char}
      </span>
      <span className="font-mono text-(--color-main) text-[10px] tracking-[1.5px] leading-none opacity-80">
        {MORSE[score.char]}
      </span>
      {mastered && (
        <span
          className="absolute top-1 right-1 size-1.5 rounded-full"
          style={{ background: "var(--color-main)" }}
        />
      )}
    </div>
  );
}
