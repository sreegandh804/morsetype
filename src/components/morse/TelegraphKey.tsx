import { useEffect, useState } from "react";
import type { InputScheme } from "@/lib/morse/useMorseInput";

interface Props {
  scheme: InputScheme;
  pressStartAt: number | null;
  lastSymbolAt: number | null;
}

/**
 * Tiny SVG of a straight key / iambic paddle that physically depresses
 * when input is detected. Pinned bottom-right of the test area.
 */
export function TelegraphKey({ scheme, pressStartAt, lastSymbolAt }: Props) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (lastSymbolAt == null) return;
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 90);
    return () => window.clearTimeout(t);
  }, [lastSymbolAt]);

  const pressed = pressStartAt != null || pulse;

  if (scheme === "two_key") {
    return <IambicPaddle leftDown={pressed} rightDown={false} />;
  }
  return <StraightKey down={pressed} />;
}

function StraightKey({ down }: { down: boolean }) {
  return (
    <svg
      viewBox="0 0 140 80"
      width={140}
      height={80}
      className="telegraph-key-svg"
      aria-hidden
    >
      <rect x={6} y={62} width={128} height={10} rx={2} fill="var(--color-surface-2)" />
      <rect x={14} y={56} width={18} height={6} fill="var(--color-sub)" />
      <circle cx={50} cy={56} r={5} fill="var(--color-sub-strong)" />
      <g
        style={{
          transformOrigin: "50px 56px",
          transform: down ? "rotate(7deg)" : "rotate(0deg)",
          transition: "transform 80ms var(--ease-out-quint)",
        }}
      >
        <rect x={50} y={51} width={70} height={5} rx={2} fill="var(--color-sub-strong)" />
        <circle cx={114} cy={53} r={9} fill="var(--color-main)" opacity={down ? 1 : 0.85} />
        <circle cx={114} cy={53} r={9} fill="none" stroke="var(--color-main-border)" strokeWidth={1} />
      </g>
      <rect x={108} y={66} width={12} height={6} fill="var(--color-sub-faint)" />
    </svg>
  );
}

function IambicPaddle({ leftDown, rightDown }: { leftDown: boolean; rightDown: boolean }) {
  return (
    <svg viewBox="0 0 140 80" width={140} height={80} className="telegraph-key-svg" aria-hidden>
      <rect x={6} y={62} width={128} height={10} rx={2} fill="var(--color-surface-2)" />
      <circle cx={70} cy={56} r={4} fill="var(--color-sub-strong)" />
      <g
        style={{
          transformOrigin: "70px 56px",
          transform: leftDown ? "rotate(-6deg)" : "rotate(0deg)",
          transition: "transform 80ms var(--ease-out-quint)",
        }}
      >
        <rect x={20} y={52} width={48} height={5} rx={2} fill="var(--color-sub-strong)" />
        <rect x={18} y={46} width={6} height={16} rx={1} fill="var(--color-main)" />
      </g>
      <g
        style={{
          transformOrigin: "70px 56px",
          transform: rightDown ? "rotate(6deg)" : "rotate(0deg)",
          transition: "transform 80ms var(--ease-out-quint)",
        }}
      >
        <rect x={72} y={52} width={48} height={5} rx={2} fill="var(--color-sub-strong)" />
        <rect x={116} y={46} width={6} height={16} rx={1} fill="var(--color-main)" />
      </g>
    </svg>
  );
}