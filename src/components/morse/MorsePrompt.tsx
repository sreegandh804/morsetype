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
        const state = isCurrent
          ? "current"
          : done
            ? isError ? "error" : "done"
            : "ghost";

        let color = "var(--color-sub-faint)";
        if (isCurrent) color = "var(--color-main)";
        else if (done) color = isError ? "var(--color-error)" : "var(--color-sub-strong)";

        const morseGlyph = isSpace ? "" : MORSE[ch.toUpperCase()] ?? "";
        // With hints on we always show morse below every non-space letter
        // (target for ghosts, user's live input on the current). With hints
        // off we only reveal the dits/dashes the user is actively typing on
        // the current letter — no template/blank row above ghost letters.
        const showMorseRow =
          !isSpace && (showHints || (isCurrent && currentMorse.length > 0));
        const hintMorse =
          isCurrent && currentMorse ? currentMorse : morseGlyph;

        return (
          <span
            key={`${i}-${state}`}
            data-state={state}
            className="morse-letter inline-flex flex-col items-center px-[1px] py-1"
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
                textDecorationColor: "var(--color-error)",
                textUnderlineOffset: 4,
                transition: "color 140ms ease",
              }}
            >
              {isCurrent && <span className="caret prompt-caret absolute -left-[3px]" />}
              {isSpace ? " " : ch}
            </span>
            {showMorseRow && (
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
