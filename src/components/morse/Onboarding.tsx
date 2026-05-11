import { useState } from "react";
import { useMorseInput, type InputScheme } from "@/lib/morse/useMorseInput";
import { MORSE } from "@/lib/morse/alphabet";
import { InputVisualizer } from "./InputVisualizer";
import { MorsePrompt } from "./MorsePrompt";
import { Button } from "@/components/ui/button";

const TARGET = "hi";
const ONBOARD_UNIT_MS = 120;

interface Props {
  onComplete: () => void;
  onSkip: () => void;
  scheme: InputScheme;
}

export function Onboarding({ onComplete, onSkip, scheme }: Props) {
  const [typed, setTyped] = useState("");
  const [errors, setErrors] = useState<boolean[]>([]);
  const [invalidAt, setInvalidAt] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  function handleChar(decoded: string) {
    if (done) return;
    if (decoded === " ") return;
    const expected = TARGET[typed.length];
    if (!expected) return;
    const ok = decoded.toUpperCase() === expected.toUpperCase();
    const next = typed + decoded;
    setTyped(next);
    setErrors((e) => [...e, !ok]);
    if (next.length >= TARGET.length) setDone(true);
  }

  function handleBackspace() {
    if (done || typed.length === 0) return;
    setTyped((s) => s.slice(0, -1));
    setErrors((e) => e.slice(0, -1));
  }

  const { currentMorse, lastSymbolAt, pressStartAt } = useMorseInput({
    scheme,
    gapMode: "auto",
    unitMs: ONBOARD_UNIT_MS,
    audio: false,
    pitchHz: 600,
    enabled: !done,
    onChar: handleChar,
    onInvalid: () => setInvalidAt(performance.now()),
    onBackspace: handleBackspace,
  });

  const currentChar = TARGET[typed.length];
  const targetMorse = currentChar ? MORSE[currentChar.toUpperCase()] ?? null : null;

  const schemeHint =
    scheme === "paddle"
      ? <>spacebar — tap for <span className="text-(--color-main)">dit</span>, hold for <span className="text-(--color-main)">dah</span></>
      : scheme === "two_key"
        ? <><span className="text-(--color-main)">j</span> = dit, <span className="text-(--color-main)">k</span> = dah</>
        : <><span className="text-(--color-main)">.</span> = dit, <span className="text-(--color-main)">-</span> = dah</>;

  return (
    <div className="max-w-xl w-full flex flex-col items-center gap-6 text-center">
      <div>
        <h2 className="font-display text-3xl mb-3">
          <span className="text-(--color-text)">welcome to </span>
          <span className="text-(--color-main)">morsetype</span>
        </h2>
        <p className="text-(--color-sub-strong) text-sm leading-relaxed max-w-md mx-auto">
          morse is two sounds: <span className="text-(--color-main)">dit</span> (·) and{" "}
          <span className="text-(--color-main)">dah</span> (−). {schemeHint}. pause briefly
          between letters and the trainer will figure out where one letter ends and the next begins.
        </p>
      </div>

      <div className="text-(--color-sub-faint) text-[11px] lowercase tracking-wide">
        try it — key the word below
      </div>

      <InputVisualizer
        currentInput={currentMorse}
        targetMorse={targetMorse}
        lastSymbolAt={lastSymbolAt}
        pressStartAt={pressStartAt}
        unitMs={ONBOARD_UNIT_MS}
        gapMode="auto"
        scheme={scheme}
        invalidAt={invalidAt}
      />

      <MorsePrompt
        target={TARGET}
        typed={typed}
        errors={errors}
        showHints={true}
        currentMorse={currentMorse}
        morse={MORSE}
      />

      <div className="flex items-center gap-4 mt-2">
        {done ? (
          <Button
            onClick={onComplete}
            className="bg-(--color-main) text-(--primary-foreground) hover:bg-(--color-main)/90"
          >
            start practice →
          </Button>
        ) : (
          <button
            onClick={onSkip}
            className="text-(--color-sub-faint) hover:text-(--color-sub) text-[12px] lowercase tracking-wide underline underline-offset-4"
          >
            skip intro
          </button>
        )}
      </div>
    </div>
  );
}
