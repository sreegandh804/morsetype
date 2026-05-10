import { MORSE } from "@/lib/morse/alphabet";

interface Props {
  target: string;
  typed: string; // string of typed chars (correct or incorrect, length <= target.length)
  errors: boolean[]; // per typed char: true if wrong
  showHints: boolean;
  currentMorse: string; // live morse buffer for current letter
}

export function MorsePrompt({ target, typed, errors, showHints, currentMorse }: Props) {
  const cursor = typed.length;
  return (
    <div className="font-mono text-2xl md:text-3xl leading-relaxed select-none whitespace-pre-wrap break-words">
      {target.split("").map((ch, i) => {
        const done = i < cursor;
        const isCurrent = i === cursor;
        let color = "text-(--color-sub)";
        if (done) color = errors[i] ? "text-(--color-error)" : "text-(--color-success)";
        const morse = ch === " " ? "/" : MORSE[ch.toUpperCase()] ?? "";
        return (
          <span key={i} className="inline-block">
            <span className={`inline-flex flex-col items-center px-[2px] ${color}`}>
              <span className="relative">
                {isCurrent && <span className="caret absolute -left-[3px]" />}
                {ch === " " ? "\u00A0" : ch}
              </span>
              {showHints && (
                <span className="text-[0.5em] text-(--color-sub) tracking-widest -mt-1">
                  {isCurrent && currentMorse
                    ? <span className="text-(--color-main)">{currentMorse}</span>
                    : morse}
                </span>
              )}
            </span>
          </span>
        );
      })}
    </div>
  );
}
