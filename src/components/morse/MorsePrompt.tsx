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
    <div className="flex flex-wrap justify-center px-4 py-6 min-h-[7.5rem] gap-y-2 select-none leading-tight">
      {target.split("").map((ch, i) => {
        const done = i < cursor;
        const isCurrent = i === cursor;
        const isSpace = ch === " ";
        const isError = done && errors[i];

        let color = "var(--sub-faint)";
        if (isCurrent) color = "var(--main)";
        else if (done) color = isError ? "var(--error)" : "var(--sub-strong)";

        const morseGlyph = isSpace ? "" : MORSE[ch.toUpperCase()] ?? "";
        const hintMorse =
          isCurrent && currentMorse ? currentMorse : morseGlyph;

        return (
          <span
            key={i}
            className="inline-flex flex-col items-center px-[1px] py-1 transition-colors"
            style={{
              minWidth: isSpace ? 16 : 28,
              gap: 4,
            }}
          >
            <span
              className="relative font-mono font-medium text-[22px]"
              style={{
                color,
                textDecoration: isError ? "underline" : "none",
                textDecorationColor: "var(--error)",
                textUnderlineOffset: 4,
              }}
            >
              {isCurrent && <span className="caret absolute -left-[3px]" />}
              {isSpace ? " " : ch}
            </span>
            {showHints && !isSpace && (
              <span
                className="font-mono text-[10px] tracking-[1px]"
                style={{
                  color,
                  opacity: isCurrent ? 0.85 : 0.6,
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
