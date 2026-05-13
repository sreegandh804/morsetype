import { Button } from "@/components/ui/button";
import type { Settings } from "@/lib/morse/storage";
import { Stat } from "./StatsBar";

interface Props {
  wpm: number;
  acc: number;
  elapsedMs: number;
  correct: number;
  incorrect: number;
  settings: Settings;
  onRestart: () => void;
  direction?: "send" | "decode";
}

export function Results({ wpm, acc, elapsedMs, correct, incorrect, settings, onRestart, direction = "send" }: Props) {
  void direction;
  const accColor =
    acc >= 100 ? "var(--color-success)" :
    acc >= 90 ? "var(--color-main)" :
    "var(--color-error)";

  return (
    <div
      className="w-full flex flex-col items-center gap-6"
      style={{ viewTransitionName: "results-card" } as React.CSSProperties}
    >
      <div
        className="w-full px-8 py-7 rounded-xl text-center"
        style={{
          background: "var(--color-main-soft)",
          border: "1px solid var(--color-main-border)",
        }}
      >
        <div className="text-sm text-(--color-sub-strong) mb-4 tracking-wide lowercase">
          complete
        </div>
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-5">
          <Stat label="wpm" value={wpm} from={0} round />
          <Stat label="accuracy" value={acc} from={0} color={accColor} format={(n) => `${Math.round(n)}%`} />
          <Stat label="correct" value={correct} from={0} color="var(--color-sub-strong)" />
          <Stat
            label="errors"
            value={incorrect}
            from={0}
            color={incorrect > 0 ? "var(--color-error)" : "var(--color-sub)"}
          />
          <Stat label="time" value={elapsedMs / 1000} from={0} dim format={(n) => `${n.toFixed(1)}s`} />
        </div>
        <div className="text-[11px] text-(--color-sub-faint) lowercase tracking-wide">
          tab + enter → restart
        </div>
      </div>

      <div className="text-(--color-sub-faint) text-[11px] lowercase tracking-wide">
        {settings.content.replace("_", " ")} · {settings.scheme.replace("_", " ")}
      </div>

      <Button
        variant="ghost"
        onClick={onRestart}
        className="text-(--color-sub) hover:text-(--color-text) text-xs lowercase tracking-wide"
      >
        next test (tab → enter)
      </Button>
    </div>
  );
}
