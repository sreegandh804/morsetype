import { lessonFor } from "@/lib/morse/curriculum";
import {
  type CourseState,
  masteryOf,
  masteryPct,
  isMastered,
  isStruggling,
} from "@/lib/morse/progress";
import { vtNameFor } from "@/lib/morse/viewTransition";

interface Props {
  chars: string[];
  activeChar: string | null;
  course: CourseState;
  /** session progress 0..1 — drawn as a faint underline beneath the rail */
  progress: number;
}

function ringColor(course: CourseState, ch: string): string {
  const m = masteryOf(course, ch);
  if (!m.introduced) return "var(--color-sub-faint)";
  if (isStruggling(m)) return "var(--color-error)";
  if (isMastered(m)) return "var(--color-success)";
  return "var(--color-main)";
}

/**
 * The characters this session is about, shown as live mastery-ring nodes that
 * persist across every activity (so View Transitions hold them steady while the
 * drill content morphs). Replaces a bare progress bar with something meaningful.
 */
export function FocusRail({ chars, activeChar, course, progress }: Props) {
  const shown = chars.filter((c) => lessonFor(c)).slice(0, 8);
  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {shown.map((ch) => {
          const m = masteryOf(course, ch);
          const pct = m.introduced ? masteryPct(m) : 0;
          const active = ch === activeChar;
          return (
            <div
              key={ch}
              className="rail-node"
              data-active={active}
              title={`${ch} ${lessonFor(ch)?.code ?? ""} · ${pct}%`}
              style={
                {
                  "--mastery-deg": `${pct * 3.6}deg`,
                  "--ring-color": ringColor(course, ch),
                  viewTransitionName: vtNameFor("rail", ch),
                } as React.CSSProperties
              }
            >
              <span
                className="rail-node-inner"
                style={{ color: active ? "var(--color-text)" : "var(--color-sub-strong)" }}
              >
                {ch}
              </span>
            </div>
          );
        })}
      </div>
      <div
        className="h-px w-40 rounded-full overflow-hidden"
        style={{ background: "var(--color-surface-2)" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${progress * 100}%`, background: "var(--color-main)" }}
        />
      </div>
    </div>
  );
}
