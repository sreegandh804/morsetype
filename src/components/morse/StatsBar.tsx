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
  return (
    <div className="flex items-center gap-6 text-(--color-sub) text-sm font-mono">
      <span><span className="text-(--color-main)">{Math.round(wpm)}</span> wpm</span>
      <span><span className="text-(--color-main)">{Math.round(acc)}%</span> acc</span>
      <span><span className="text-(--color-main)">{(elapsedMs/1000).toFixed(1)}s</span></span>
      <span className="flex-1 max-w-xs h-1 bg-(--color-border) rounded">
        <span className="block h-full bg-(--color-main) rounded transition-all" style={{ width: `${pct}%` }} />
      </span>
      {active && <span className="text-(--color-main) animate-pulse">●</span>}
    </div>
  );
}
