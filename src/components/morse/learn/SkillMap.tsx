import { lessonFor } from "@/lib/morse/curriculum";
import {
  type CourseState,
  orderOf,
  masteryOf,
  masteryPct,
  isMastered,
  isStruggling,
} from "@/lib/morse/progress";

type NodeState = "mastered" | "learning" | "struggling" | "current" | "locked";

function stateOf(s: CourseState, ch: string, index: number): NodeState {
  if (index >= s.unlockedCount) return index === s.unlockedCount ? "current" : "locked";
  const m = masteryOf(s, ch);
  if (isStruggling(m)) return "struggling";
  if (isMastered(m)) return "mastered";
  return "learning";
}

const RING_COLOR: Record<NodeState, string> = {
  mastered: "var(--color-success)",
  learning: "var(--color-main)",
  struggling: "var(--color-error)",
  current: "var(--color-sub)",
  locked: "var(--color-sub-faint)",
};

interface Props {
  course: CourseState;
  onDrillChar?: (ch: string) => void;
}

export function SkillMap({ course, onDrillChar }: Props) {
  const order = orderOf(course);
  return (
    <div className="flex flex-wrap gap-2.5 justify-center max-w-3xl mx-auto">
      {order.map((ch, i) => {
        const L = lessonFor(ch);
        if (!L) return null;
        const st = stateOf(course, ch, i);
        const pct = st === "locked" || st === "current" ? 0 : masteryPct(masteryOf(course, ch));
        const ring = RING_COLOR[st];
        const interactive = st !== "locked" && st !== "current" && !!onDrillChar;
        const label =
          st === "locked"
            ? `${L.ch} — locked`
            : st === "current"
              ? `${L.ch} — next to learn`
              : `${L.ch} ${L.code} · ${L.word} · ${pct}% mastered`;
        return (
          <button
            key={ch}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onDrillChar?.(ch)}
            title={label}
            aria-label={label}
            className="learn-node group"
            data-state={st}
            style={
              {
                // mastery ring is a registered <angle> so it spring-fills via CSS
                "--mastery-deg": `${pct * 3.6}deg`,
                "--ring-color": ring,
              } as React.CSSProperties
            }
          >
            <span className="learn-node-inner">
              <span
                className="font-mono font-semibold leading-none"
                style={{
                  fontSize: "1.05rem",
                  color:
                    st === "locked"
                      ? "var(--color-sub-faint)"
                      : st === "current"
                        ? "var(--color-sub-strong)"
                        : st === "struggling"
                          ? "var(--color-error-strong)"
                          : st === "mastered"
                            ? "var(--color-success)"
                            : "var(--color-text)",
                }}
              >
                {st === "locked" ? "·" : L.ch}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
