import { useEffect, useState } from "react";
import type { InputScheme, GapMode } from "@/lib/morse/useMorseInput";

interface Props {
  currentInput: string;
  targetMorse: string | null;
  lastSymbolAt: number | null;
  pressStartAt: number | null;
  unitMs: number;
  gapMode: GapMode;
  scheme: InputScheme;
  invalidAt: number | null;
}

type PelletState = "ghost" | "correct" | "wrong";

export function InputVisualizer({
  currentInput,
  targetMorse,
  lastSymbolAt,
  pressStartAt,
  unitMs,
  gapMode,
  scheme,
  invalidAt,
}: Props) {
  const [pressMs, setPressMs] = useState(0);
  useEffect(() => {
    if (pressStartAt == null) { setPressMs(0); return; }
    let raf = 0;
    const tick = () => {
      setPressMs(performance.now() - pressStartAt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pressStartAt]);

  const [showInvalid, setShowInvalid] = useState(false);
  useEffect(() => {
    if (invalidAt == null) return;
    setShowInvalid(true);
    const t = window.setTimeout(() => setShowInvalid(false), 350);
    return () => window.clearTimeout(t);
  }, [invalidAt]);

  if (!targetMorse) {
    return <div className="h-14" aria-hidden />;
  }

  const symbols = targetMorse.split("") as Array<"." | "-">;
  const typed = currentInput.split("") as Array<"." | "-">;
  const isPaddleHeld = scheme === "paddle" && pressStartAt != null;
  const showCountdown =
    gapMode === "auto" && lastSymbolAt != null && currentInput.length > 0;
  const isCorrectSoFar = targetMorse.startsWith(currentInput);

  const borderColor = showInvalid
    ? "var(--color-error-strong)"
    : isCorrectSoFar
      ? "var(--color-main-border)"
      : "var(--color-error-border)";

  const overflow = typed.slice(symbols.length);
  const paddlePreviewAtOverflow = isPaddleHeld && typed.length >= symbols.length;

  return (
    <div className="flex items-center justify-center h-14 mb-2">
      <div
        className="relative flex items-center gap-1.5 px-5 py-3 rounded-lg justify-center overflow-hidden"
        style={{
          background: showInvalid ? "var(--color-error-soft)" : "var(--color-surface-1)",
          border: `1px solid ${borderColor}`,
          transition: "background 200ms ease, border-color 100ms ease",
          minWidth: 120,
        }}
        aria-live="polite"
      >
        {symbols.map((sym, i) => {
          if (isPaddleHeld && i === typed.length) {
            return <PaddlePreview key={`p-${i}`} pressMs={pressMs} unitMs={unitMs} />;
          }
          const userSym = typed[i];
          const filled = userSym != null;
          const correct = filled && userSym === sym;
          const state: PelletState = !filled ? "ghost" : correct ? "correct" : "wrong";
          return <Pellet key={i} kind={sym} state={state} />;
        })}
        {overflow.map((c, i) => (
          <Pellet key={`x-${i}`} kind={c} state="wrong" />
        ))}
        {paddlePreviewAtOverflow && (
          <PaddlePreview pressMs={pressMs} unitMs={unitMs} />
        )}
        {showCountdown && (
          <span
            key={lastSymbolAt}
            className="imv-countdown"
            style={{
              background: isCorrectSoFar ? "var(--color-main)" : "var(--color-error)",
              animationDuration: `${unitMs * 3}ms`,
            }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}

function Pellet({ kind, state }: { kind: "." | "-"; state: PelletState }) {
  const width = kind === "." ? 10 : 30;
  const fill =
    state === "correct" ? "var(--color-main)" :
    state === "wrong" ? "var(--color-error)" :
    "transparent";
  return (
    <span
      className="inline-block rounded-[2px]"
      style={{
        width,
        height: 10,
        background: fill,
        border: state === "ghost" ? "1px solid var(--color-sub-faint)" : "none",
        boxSizing: "border-box",
        transition: "background 100ms ease",
      }}
    />
  );
}

function PaddlePreview({ pressMs, unitMs }: { pressMs: number; unitMs: number }) {
  const threshold = unitMs * 2;
  const isDah = pressMs >= threshold;
  const widthRatio = Math.min(1, pressMs / threshold);
  const width = 10 + widthRatio * 20;
  return (
    <span
      className="inline-block rounded-[2px]"
      style={{
        width,
        height: 10,
        background: isDah ? "var(--color-main)" : "var(--color-sub-strong)",
        transition: "background 80ms ease",
      }}
    />
  );
}
