import { MORSE } from "@/lib/morse/alphabet";

interface Props {
  target: string;
  typed: string;
  errors: boolean[];
  showHints: boolean;
  currentMorse: string;
}

export function MorsePrompt({ target, typed, errors, showHints, currentMorse }: Props) {
  const cursor = typed.length;
  return (
    <div
      className="flex flex-wrap justify-center px-4 py-6 min-h-[7.5rem] gap-y-2 leading-tight"
      style={{ viewTransitionName: "prompt-area" } as React.CSSProperties}
    >
      {target.split("").map((ch, i) => {
        const done = i < cursor;
        const isCurrent = i === cursor;
        const isSpace = ch === " ";
        const isError = done && errors[i];

        let color = "var(--color-sub-faint)";
        if (isCurrent) color = "var(--color-main)";
        else if (done) color = isError ? "var(--color-error)" : "var(--color-sub-strong)";

        const morseGlyph = isSpace ? "" : MORSE[ch.toUpperCase()] ?? "";
        const hintMorse =
          isCurrent && currentMorse ? currentMorse : morseGlyph;

        const scale = isCurrent ? 1.06 : 1;

        return (
          <span
            key={i}
            className="inline-flex flex-col items-center px-[1px] py-1"
            style={{
              minWidth: isSpace ? 16 : 28,
              gap: 4,
              transform: `scale(${scale})`,
              transformOrigin: "center bottom",
              transition: "transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <span
              className="relative font-mono font-medium text-[22px]"
              style={{
                color,
                textDecoration: isError ? "underline" : "none",
                textDecorationColor: "var(--color-error)",
                textUnderlineOffset: 4,
                transition: "color 140ms ease",
              }}
            >
              {isCurrent && <span className="caret prompt-caret absolute -left-[3px]" />}
              {isSpace ? " " : ch}
            </span>
            {showHints && !isSpace && (
              <span
                className="font-mono text-[10px] tracking-[1px]"
                style={{
                  color,
                  opacity: isCurrent ? 0.85 : 0.6,
                  transition: "color 140ms ease, opacity 140ms ease",
                }}
              >
                {hintMorse}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
