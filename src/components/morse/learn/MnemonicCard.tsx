import { lessonFor } from "@/lib/morse/curriculum";
import { DitDahRow } from "./DitDahRow";
import { Volume2 } from "lucide-react";

interface Props {
  ch: string;
  level?: "full" | "fading";
  playing?: boolean;
  symbolIndex?: number;
  onPlay?: () => void;
  className?: string;
}

/**
 * Tier-B visual mnemonic: the dits & dahs drawn as shapes under the letter, plus
 * a spoken-rhythm cue, a memorable word, and a phrase whose stress pattern *is*
 * the code. The illustrated "Tier-C" version (a picture with the code drawn into
 * it) can later swap in here behind a feature flag — same slot, richer art.
 */
export function MnemonicCard({
  ch,
  level = "full",
  playing = false,
  symbolIndex = -1,
  onPlay,
  className = "",
}: Props) {
  const L = lessonFor(ch);
  if (!L) return null;
  const display = /[A-Z0-9]/.test(L.ch) ? L.ch : L.ch; // punctuation shown as-is

  if (level === "fading") {
    return (
      <button
        onClick={onPlay}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-(--color-main-soft) ${className}`}
        style={{ background: "var(--color-surface-1)", border: "1px solid var(--color-hairline)" }}
        title="replay"
      >
        <span className="font-mono text-2xl font-semibold text-(--color-sub-strong)">
          {display}
        </span>
        <DitDahRow code={L.code} size="sm" playingIndex={playing ? symbolIndex : -1} />
        <span className="text-(--color-sub-faint) text-[11px] lowercase tracking-wide">
          {L.rhythm}
        </span>
      </button>
    );
  }

  return (
    <div
      className={`w-full max-w-md flex flex-col items-center gap-5 px-7 py-7 rounded-2xl ${className}`}
      style={{ background: "var(--color-main-soft)", border: "1px solid var(--color-main-border)" }}
    >
      <div
        className="font-mono font-semibold text-(--color-text) leading-none select-none"
        style={{
          fontSize: "5rem",
          textShadow: playing ? "0 0 28px var(--color-main)" : "none",
          transition: "text-shadow 120ms ease",
        }}
      >
        {display}
      </div>

      <button
        onClick={onPlay}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-transform active:scale-95"
        style={{ background: "var(--color-surface-1)", border: "1px solid var(--color-hairline)" }}
      >
        <Volume2 className="size-4 text-(--color-main)" />
        <DitDahRow code={L.code} size="md" playingIndex={playing ? symbolIndex : -1} />
      </button>

      <div className="text-center space-y-1.5">
        <div className="font-mono text-(--color-main) text-lg tracking-[0.15em]">{L.rhythm}</div>
        <div className="text-(--color-sub-strong) text-sm">
          <span className="text-(--color-text) font-medium">{L.word}</span>
          <span className="text-(--color-sub-faint)"> — “{L.phrase}”</span>
        </div>
      </div>

      <p className="text-(--color-sub-strong) text-[13px] leading-relaxed text-center max-w-sm">
        {L.hint}
      </p>

      {L.confuse.length > 0 && (
        <div className="text-[11px] text-(--color-sub-faint) lowercase tracking-wide">
          watch out for{" "}
          {L.confuse.slice(0, 3).map((c, i) => (
            <span key={c}>
              {i > 0 && " · "}
              <span className="font-mono text-(--color-sub)">{c}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
