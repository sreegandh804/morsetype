interface Props {
  wpm: number;
  acc: number;
  elapsedMs: number;
  total: number;
  typed: number;
  active: boolean;
}

export function StatsBar({ wpm, acc, elapsedMs, total, typed, active }: Props) {
  const pct = total > 0 ? Math.min(100, (typed / total) * 100) : 0;
  const accColor =
    acc >= 100 ? "var(--success)" :
    acc >= 90 ? "var(--main)" :
    acc > 0 ? "var(--error)" :
    "var(--main)";

  return (
    <div className="w-full pt-5 border-t border-(--color-hairline)">
      <div className="flex justify-center items-end gap-12">
        <Stat label="wpm" value={Math.round(wpm)} />
        <Stat label="acc" value={`${Math.round(acc)}%`} color={accColor} />
        <Stat label="time" value={`${(elapsedMs / 1000).toFixed(1)}s`} dim />
      </div>
      <div className="mt-4 h-px w-full max-w-md mx-auto bg-(--color-hairline) overflow-hidden">
        <span
          className="block h-full bg-(--color-main) transition-all duration-150"
          style={{ width: `${pct}%`, opacity: active ? 1 : 0.4 }}
        />
      </div>
    </div>
  );
}

export function Stat({
  label,
  value,
  color,
  dim,
}: {
  label: string;
  value: string | number;
  color?: string;
  dim?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="stat-value"
        style={{ color: color ?? (dim ? "rgba(255,255,255,0.4)" : undefined) }}
      >
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
