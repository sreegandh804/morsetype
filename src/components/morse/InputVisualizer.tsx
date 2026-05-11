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

  const [completePulse, setCompletePulse] = useState(false);
  useEffect(() => {
    if (!targetMorse) return;
    if (currentInput.length > 0 && currentInput === targetMorse) {
      setCompletePulse(true);
      const t = window.setTimeout(() => setCompletePulse(false), 280);
      return () => window.clearTimeout(t);
    }
  }, [currentInput, targetMorse]);

  if (!targetMorse) {
    return <div className="h-14" aria-hidden />;
  }

  const symbols = targetMorse.split("") as Array<"." | "-">;
  const typed = currentInput.split("") as Array<"." | "-">;
  const isPaddleHeld = scheme === "paddle" && pressStartAt != null;
  const showCountdown =
    gapMode === "auto" && lastSymbolAt != null && currentInput.length > 0;
  const isCorrectSoFar = targetMorse.startsWith(currentInput);

  const overflow = typed.slice(symbols.length);
  const paddlePreviewAtOverflow = isPaddleHeld && typed.length >= symbols.length;

  const rowClasses = [
    "relative flex items-center gap-2",
    showInvalid ? "imv-shake" : "",
    completePulse ? "imv-pulse" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col items-center justify-center h-14 mb-3 gap-2">
      <div className={rowClasses} aria-live="polite">
        {symbols.map((sym, i) => {
          if (isPaddleHeld && i === typed.length) {
            return <PaddlePreview key={`p-${i}`} pressMs={pressMs} unitMs={unitMs} />;
          }
          const userSym = typed[i];
          const filled = userSym != null;
          const correct = filled && userSym === sym;
          const state: PelletState = !filled ? "ghost" : correct ? "correct" : "wrong";
          return <Pellet key={`${i}-${state}`} kind={sym} state={state} />;
        })}
        {overflow.map((c, i) => (
          <Pellet key={`x-${i}`} kind={c} state="wrong" />
        ))}
        {paddlePreviewAtOverflow && (
          <PaddlePreview pressMs={pressMs} unitMs={unitMs} />
        )}
      </div>
      <span
        key={`cd-${lastSymbolAt}`}
        className="imv-countdown-line"
        style={{
          background: isCorrectSoFar ? "var(--color-main)" : "var(--color-error)",
          animationDuration: `${unitMs * 3}ms`,
          opacity: showCountdown ? 0.7 : 0,
        }}
        aria-hidden
      />
    </div>
  );
}

function Pellet({ kind, state }: { kind: "." | "-"; state: PelletState }) {
  const width = kind === "." ? 12 : 36;
  const fill =
    state === "correct" ? "var(--color-main)" :
    state === "wrong" ? "var(--color-error)" :
    "transparent";
  return (
    <span
      className="inline-block rounded-[2px] pellet-in"
      style={{
        width,
        height: 12,
        background: fill,
        border: state === "ghost" ? "1.5px solid var(--color-sub-faint)" : "none",
        boxSizing: "border-box",
        boxShadow:
          state === "correct" ? "0 0 8px -2px var(--color-main)" :
          state === "wrong"   ? "0 0 8px -2px var(--color-error)" :
          "none",
      }}
    />
  );
}

function PaddlePreview({ pressMs, unitMs }: { pressMs: number; unitMs: number }) {
  const threshold = unitMs * 2;
  const isDah = pressMs >= threshold;
  const widthRatio = Math.min(1, pressMs / threshold);
  const width = 12 + widthRatio * 24;
  return (
    <span
      className="inline-block rounded-[2px]"
      style={{
        width,
        height: 12,
        background: isDah ? "var(--color-main)" : "var(--color-sub-strong)",
        transition: "background 80ms ease",
        boxShadow: isDah ? "0 0 8px -2px var(--color-main)" : "none",
      }}
    />
  );
}
