// Renders a Morse code string as dit (small square) / dah (long bar) pellets.
// Optionally highlights the symbol currently sounding (`playingIndex`).

interface Props {
  code: string;
  /** index of the symbol currently playing, or -1 / undefined for none */
  playingIndex?: number;
  /** how many symbols (from the start) the learner has matched correctly */
  matchedCount?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const DIMS = {
  sm: { dit: 8, dah: 22, h: 8, gap: 6 },
  md: { dit: 12, dah: 36, h: 12, gap: 8 },
  lg: { dit: 16, dah: 48, h: 16, gap: 10 },
};

export function DitDahRow({
  code,
  playingIndex = -1,
  matchedCount,
  size = "md",
  className = "",
}: Props) {
  const d = DIMS[size];
  return (
    <div
      className={`flex items-center ${className}`}
      style={{ gap: d.gap }}
      aria-label={`morse ${code}`}
    >
      {[...code].map((s, i) => {
        const isDah = s === "-";
        const playing = i === playingIndex;
        const matched = matchedCount != null && i < matchedCount;
        const fill = playing
          ? "var(--color-text)"
          : matched
            ? "var(--color-success)"
            : matchedCount != null
              ? "var(--color-sub-faint)"
              : "var(--color-main)";
        return (
          <span
            key={i}
            className="inline-block rounded-[2px] pellet-in"
            style={{
              width: isDah ? d.dah : d.dit,
              height: d.h,
              background: fill,
              boxShadow: playing
                ? "0 0 14px -2px var(--color-text)"
                : matched
                  ? "0 0 8px -3px var(--color-success)"
                  : "none",
              transition: "background 90ms ease, box-shadow 90ms ease, width 90ms ease",
            }}
          />
        );
      })}
    </div>
  );
}
