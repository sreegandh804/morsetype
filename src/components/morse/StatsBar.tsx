import { TweenedNumber } from "./TweenedNumber";

interface Props {
  wpm: number;
  acc: number;
  elapsedMs: number;
  total: number;
  typed: number;
  active: boolean;
  streak?: number;
}

export function StatsBar({ wpm, acc, elapsedMs, total, typed, active, streak = 0 }: Props) {
  const pct = total > 0 ? Math.min(100, (typed / total) * 100) : 0;
  const accColor =
    acc >= 100 ? "var(--color-success)" :
    acc >= 90 ? "var(--color-main)" :
    acc > 0 ? "var(--color-error)" :
    "var(--color-main)";
  const streakHot = streak >= 5;
  const streakGlow = Math.min(1, streak / 8);

  return (
    <div className="w-full pt-5 border-t border-(--color-hairline)">
      <div className="flex justify-center items-end gap-12">
        <Stat label="wpm" value={`${Math.round(wpm)}`} />
        <Stat label="acc" value={`${Math.round(acc)}%`} color={accColor} />
        <Stat label="time" value={`${(elapsedMs / 1000).toFixed(1)}s`} dim />
        <div className="flex flex-col items-center" aria-live="polite">
          <div
            className="stat-value tabular-nums"
            style={{
              color: streak > 0 ? "var(--color-main)" : "var(--color-sub-faint)",
              textShadow: streakHot
                ? `0 0 14px color-mix(in srgb, var(--color-main) ${Math.round(streakGlow * 100)}%, transparent)`
                : "none",
              transition: "color 180ms ease, text-shadow 220ms ease",
            }}
          >
            {streak > 0 ? `${streak}×` : "—"}
          </div>
          <div className="stat-label">streak</div>
        </div>
      </div>
      <div className="mt-4 h-px w-full max-w-md mx-auto bg-(--color-hairline) overflow-hidden rounded-full">
        <span
          className="block h-full bg-(--color-main)"
          style={{
            width: `${pct}%`,
            opacity: active ? 1 : 0.4,
            transition: "width 220ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease",
          }}
        />
      </div>
    </div>
  );
}

interface StatProps {
  label: string;
  value: number | string;
  color?: string;
  dim?: boolean;
  round?: boolean;
  format?: (n: number) => string | number;
  from?: number;
}

export function Stat({ label, value, color, dim, round, format, from }: StatProps) {
  const isNumber = typeof value === "number";
  return (
    <div className="flex flex-col items-center">
      <div
        className="stat-value tabular-nums"
        style={{ color: color ?? (dim ? "var(--color-sub)" : undefined) }}
      >
        {isNumber ? (
          <TweenedNumber
            value={value}
            from={from}
            format={format ?? (round ? Math.round : undefined)}
          />
        ) : (
          value
        )}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
