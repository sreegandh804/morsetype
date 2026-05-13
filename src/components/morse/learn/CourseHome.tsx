import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  type CourseState,
  type ScaffoldMode,
  courseStats,
  dueReviews,
  courseComplete,
  canRaiseCharacterSpeed,
} from "@/lib/morse/progress";
import { TEACHING_ORDERS, type TeachingOrderKey } from "@/lib/morse/curriculum";
import { buildSession, type Session } from "@/lib/morse/lessonEngine";
import { SkillMap } from "./SkillMap";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Flame, Headphones, Settings as SettingsIcon, Sparkles, ChevronDown } from "lucide-react";

interface Props {
  course: CourseState;
  onStartSession: (s: Session) => void;
  onDrillChar: (ch: string) => void;
  onPatch: (p: Partial<CourseState>) => void;
  onRaiseSpeed: () => void;
}

const SESSION_LENGTHS = [3, 5, 7, 10, 15];
const SCAFFOLDS: { key: ScaffoldMode; label: string }[] = [
  { key: "auto", label: "auto" },
  { key: "full", label: "show" },
  { key: "fading", label: "fading" },
  { key: "off", label: "audio-only" },
];

export function CourseHome({ course, onStartSession, onDrillChar, onPatch, onRaiseSpeed }: Props) {
  const stats = courseStats(course);
  const fresh = course.unlockedCount === 0;
  const due = useMemo(() => (fresh ? [] : dueReviews(course)), [course, fresh]);

  const preview = useMemo<Session>(
    () => buildSession(course),
    // intentionally narrow: rebuild only when the shape of the next session can change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [course.unlockedCount, course.effectiveWpm, course.orderKey, course.sessionMinutes],
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const done = courseComplete(course);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-10">
      {/* heading */}
      <div className="text-center space-y-2">
        <h1 className="font-display text-3xl tracking-tight">
          <span className="text-(--color-text)">learn </span>
          <span className="text-(--color-main)">by ear</span>
        </h1>
        <p className="text-(--color-sub-strong) text-sm max-w-lg leading-relaxed">
          one character at a time, always at full speed — the Koch &amp; Farnsworth way. We start
          with a picture and a rhythm, then the training wheels come off on their own. Short daily
          sessions beat marathons.
        </p>
      </div>

      {/* today's session */}
      <div
        className="w-full max-w-md rounded-2xl px-7 py-6 flex flex-col items-center gap-4 text-center"
        style={{
          background: "var(--color-main-soft)",
          border: "1px solid var(--color-main-border)",
        }}
      >
        <div className="flex items-center gap-2 text-(--color-sub-faint) text-[11px] lowercase tracking-[0.15em]">
          <Headphones className="size-3.5" /> {fresh ? "your first session" : "today's session"}
        </div>
        <div className="font-mono text-2xl text-(--color-text)">
          ~{preview.estMinutes || course.sessionMinutes} min
        </div>
        <div className="text-[12px] text-(--color-sub-strong)">
          {fresh
            ? "meet your first two characters by ear, then drill them"
            : [
                preview.introducedThisSession.length
                  ? `1 new character (${preview.introducedThisSession.join(", ")})`
                  : null,
                due.length ? `${due.length} review${due.length === 1 ? "" : "s"} due` : null,
                `${stats.unlocked} character${stats.unlocked === 1 ? "" : "s"} in rotation`,
              ]
                .filter(Boolean)
                .join(" · ")}
        </div>
        <Button
          onClick={() => onStartSession(buildSession(course))}
          className="bg-(--color-main) text-(--primary-foreground) hover:bg-(--color-main)/90 mt-1"
        >
          {fresh ? "start learning →" : "start session →"}
        </Button>
      </div>

      {/* stats strip */}
      {!fresh && (
        <div className="flex items-center gap-x-8 gap-y-2 flex-wrap justify-center text-center">
          <div>
            <div className="stat-value text-(--color-text)">
              {stats.unlocked}
              <span className="text-(--color-sub-faint) text-base"> / {stats.total}</span>
            </div>
            <div className="stat-label">characters</div>
          </div>
          <div>
            <div className="stat-value text-(--color-text)">{stats.mastered}</div>
            <div className="stat-label">mastered</div>
          </div>
          <div>
            <div
              className="stat-value"
              style={{
                color: course.streakDays > 0 ? "var(--color-main)" : "var(--color-sub-faint)",
              }}
            >
              {course.streakDays}
            </div>
            <div className="stat-label">day streak</div>
          </div>
          <div>
            <div className="stat-value text-(--color-text)">
              {course.effectiveWpm}
              <span className="text-(--color-sub-faint) text-base">/{course.characterWpm}</span>
            </div>
            <div className="stat-label">copy / char wpm</div>
          </div>
          {course.headCopyWpm > 0 && (
            <div>
              <div className="stat-value text-(--color-text)">{course.headCopyWpm}</div>
              <div className="stat-label">head-copy wpm</div>
            </div>
          )}
        </div>
      )}

      {course.streakDays > 1 && (
        <div className="inline-flex items-center gap-2 text-[12px] text-(--color-sub-strong)">
          <Flame className="size-4 text-(--color-main)" /> {course.streakDays} days in a row — keep
          it short, keep it daily
        </div>
      )}

      {/* graduation */}
      {done && (
        <div
          className="w-full max-w-md rounded-2xl px-6 py-5 text-center flex flex-col items-center gap-3"
          style={{
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-main-border)",
          }}
        >
          <div className="inline-flex items-center gap-2 text-(--color-main) text-sm">
            <Sparkles className="size-4" /> you know the whole alphabet
          </div>
          <p className="text-[12px] text-(--color-sub-strong)">
            now it's about speed — keep doing sessions to tighten your spacing, or bump your
            character speed.
          </p>
          {canRaiseCharacterSpeed(course) && (
            <Button size="sm" variant="outline" onClick={onRaiseSpeed}>
              raise character speed → {course.characterWpm + 2} wpm
            </Button>
          )}
        </div>
      )}

      {/* skill map */}
      {!fresh && (
        <div className="w-full space-y-3">
          <div className="text-center text-[11px] text-(--color-sub-faint) lowercase tracking-[0.15em]">
            your alphabet — tap a learned character to drill it
          </div>
          <SkillMap course={course} onDrillChar={onDrillChar} />
        </div>
      )}

      {/* settings */}
      <div className="w-full max-w-md">
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          className="w-full flex items-center justify-between text-[12px] text-(--color-sub) hover:text-(--color-sub-strong) lowercase tracking-wide py-2"
        >
          <span className="inline-flex items-center gap-2">
            <SettingsIcon className="size-3.5" /> course settings
          </span>
          <ChevronDown
            className={`size-3.5 transition-transform ${settingsOpen ? "rotate-180" : ""}`}
          />
        </button>
        {settingsOpen && (
          <div className="flex flex-col gap-5 px-1 py-3 text-sm">
            <Row label="session length">
              <div className="flex gap-1">
                {SESSION_LENGTHS.map((n) => (
                  <Pill
                    key={n}
                    active={course.sessionMinutes === n}
                    onClick={() => onPatch({ sessionMinutes: n })}
                  >
                    {n}m
                  </Pill>
                ))}
              </div>
            </Row>
            <Row label="teaching order">
              <div className="flex gap-1">
                {(Object.keys(TEACHING_ORDERS) as TeachingOrderKey[]).map((k) => (
                  <Pill
                    key={k}
                    active={course.orderKey === k}
                    onClick={() => onPatch({ orderKey: k })}
                    title={TEACHING_ORDERS[k].blurb}
                  >
                    {TEACHING_ORDERS[k].label}
                  </Pill>
                ))}
              </div>
            </Row>
            <Row label="hints">
              <div className="flex gap-1">
                {SCAFFOLDS.map((s) => (
                  <Pill
                    key={s.key}
                    active={course.scaffold === s.key}
                    onClick={() => onPatch({ scaffold: s.key })}
                  >
                    {s.label}
                  </Pill>
                ))}
              </div>
            </Row>
            <Row label={`character speed — ${course.characterWpm} wpm`}>
              <input
                type="range"
                min={15}
                max={30}
                value={course.characterWpm}
                onChange={(e) =>
                  onPatch({
                    characterWpm: Number(e.target.value),
                    effectiveWpm: Math.min(course.effectiveWpm, Number(e.target.value)),
                  })
                }
                className="w-40 accent-(--color-main)"
              />
            </Row>
            <Row label="kid mode (big buttons, multiple choice)">
              <Switch checked={course.kidMode} onCheckedChange={(v) => onPatch({ kidMode: v })} />
            </Row>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-[11px] text-(--color-sub-faint) lowercase tracking-wide">
        <Link to="/about" className="hover:text-(--color-sub) underline underline-offset-4">
          full alphabet chart
        </Link>
        <span>·</span>
        <Link to="/" className="hover:text-(--color-sub) underline underline-offset-4">
          free practice
        </Link>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-(--color-sub-strong) text-[12px] lowercase tracking-wide">{label}</span>
      {children}
    </div>
  );
}
function Pill({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button className="pill" data-active={active} onClick={onClick} title={title}>
      {children}
    </button>
  );
}
