// Course progress — per-character mastery, spaced repetition, Farnsworth speed
// management. Persisted to localStorage; structured so it can later sync to a
// `course_state` row keyed by the authenticated user.

import { ALL_COURSE_CHARS, TEACHING_ORDERS, type TeachingOrderKey, lessonFor } from "./curriculum";

const DAY_MS = 24 * 60 * 60 * 1000;
const RELEARN_MS = 9 * 60 * 1000; // a lapsed char comes back in ~9 minutes
const RECENT_WINDOW = 10; // size of the rolling accuracy window per skill
const MIN_EFFECTIVE_WPM = 6;
const EMA_ALPHA = 0.3;

export type ScaffoldMode = "auto" | "full" | "fading" | "off";

export interface CharMastery {
  ch: string;
  introduced: boolean;
  reps: number; // total recognition + send reps
  lapses: number;
  recallRate: number; // EMA of recognition correctness, 0..1
  sendRate: number; // EMA of "key it" correctness, 0..1
  recentRecall: boolean[]; // rolling window — drives the 90% Koch gate
  ease: number; // SM-2-style ease factor
  intervalDays: number; // current review interval
  dueAt: number; // epoch ms when this char is due for review
  bestCopyWpm: number; // fastest character speed still ≥90% on this char
  lastSeen: number; // epoch ms
}

export interface CourseState {
  version: 2;
  createdAt: number;
  orderKey: TeachingOrderKey;
  characterWpm: number; // element speed — never goes below ~18 for "real" CW
  effectiveWpm: number; // overall PARIS speed (Farnsworth); ≤ characterWpm
  scaffold: ScaffoldMode; // "auto" lets mastery decide; otherwise pinned
  kidMode: boolean; // larger UI + multiple-choice recognition
  sessionMinutes: number; // target session length (3–15)
  unlockedCount: number; // how many chars of the order are active
  perChar: Record<string, CharMastery>;
  // habit + history
  streakDays: number;
  lastSessionDate: string; // YYYY-MM-DD (local)
  sessionsCompleted: number;
  totalMinutes: number;
  goodSessionStreak: number; // consecutive ≥92%-accuracy sessions (for speed ramp)
  headCopyWpm: number; // best head-copy effective speed
}

const KEY = "morsetype.course.v2";

// ── persistence ────────────────────────────────────────────────────────────

function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function freshCourse(): CourseState {
  return {
    version: 2,
    createdAt: Date.now(),
    orderKey: "koch",
    characterWpm: 18,
    effectiveWpm: 8,
    scaffold: "auto",
    kidMode: false,
    sessionMinutes: 7,
    unlockedCount: 0,
    perChar: {},
    streakDays: 0,
    lastSessionDate: "",
    sessionsCompleted: 0,
    totalMinutes: 0,
    goodSessionStreak: 0,
    headCopyWpm: 0,
  };
}

function migrate(raw: unknown): CourseState {
  const base = freshCourse();
  if (!raw || typeof raw !== "object") return base;
  const merged = { ...base, ...(raw as Partial<CourseState>) } as CourseState;
  // re-hydrate any per-char records missing fields
  for (const [ch, m] of Object.entries(merged.perChar ?? {})) {
    merged.perChar[ch] = { ...freshMastery(ch), ...(m as Partial<CharMastery>) };
  }
  merged.version = 2;
  return merged;
}

export function loadCourse(): CourseState {
  if (typeof window === "undefined") return freshCourse();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshCourse();
    return migrate(JSON.parse(raw));
  } catch {
    return freshCourse();
  }
}

export function saveCourse(s: CourseState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent("morsetype:course-changed"));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export function hasStartedCourse(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(KEY);
}

// ── derived queries ────────────────────────────────────────────────────────

export function orderOf(s: CourseState): string[] {
  return TEACHING_ORDERS[s.orderKey].order.filter((c) => lessonFor(c));
}

export function unlockedChars(s: CourseState): string[] {
  return orderOf(s).slice(0, s.unlockedCount);
}

export function nextLockedChar(s: CourseState): string | null {
  const order = orderOf(s);
  return order[s.unlockedCount] ?? null;
}

export function masteryOf(s: CourseState, ch: string): CharMastery {
  return s.perChar[ch] ?? freshMastery(ch);
}

/** 0–100. Blends recognition (primary), send ability, and exposure. */
export function masteryPct(m: CharMastery): number {
  if (!m.introduced) return 0;
  const exposure = Math.min(1, m.reps / 12);
  const score = 0.6 * m.recallRate + 0.25 * m.sendRate + 0.15 * exposure;
  return Math.round(score * 100);
}

export function isMastered(m: CharMastery): boolean {
  return m.introduced && m.recallRate >= 0.92 && m.reps >= 10;
}

export function isStruggling(m: CharMastery): boolean {
  return m.introduced && m.reps >= 4 && m.recallRate < 0.7;
}

export function dueReviews(s: CourseState, now = Date.now()): string[] {
  return unlockedChars(s)
    .filter((c) => masteryOf(s, c).dueAt <= now)
    .sort((a, b) => masteryOf(s, a).dueAt - masteryOf(s, b).dueAt);
}

/** Trailing recognition accuracy across every introduced character. */
export function overallRecall(s: CourseState): number {
  const ms = unlockedChars(s)
    .map((c) => masteryOf(s, c))
    .filter((m) => m.reps > 0);
  if (ms.length === 0) return 1;
  let hit = 0,
    total = 0;
  for (const m of ms) {
    hit += m.recentRecall.filter(Boolean).length;
    total += m.recentRecall.length;
  }
  return total === 0 ? 1 : hit / total;
}

/** The Koch gate: may we introduce the next character? */
export function canIntroduceNext(s: CourseState): boolean {
  if (!nextLockedChar(s)) return false;
  if (s.unlockedCount === 0) return true; // first two characters come free-ish
  if (s.unlockedCount === 1) return true;
  const newest = masteryOf(s, orderOf(s)[s.unlockedCount - 1]);
  if (newest.reps < 6 || newest.recallRate < 0.9) return false;
  if (overallRecall(s) < 0.9) return false;
  if (unlockedChars(s).some((c) => isStruggling(masteryOf(s, c)))) return false;
  return true;
}

/** Effective scaffold for one character given the global setting + its mastery. */
export function scaffoldFor(s: CourseState, ch: string): "full" | "fading" | "off" {
  if (s.scaffold !== "auto") return s.scaffold;
  const pct = masteryPct(masteryOf(s, ch));
  if (pct >= 85) return "off";
  if (pct >= 55) return "fading";
  return "full";
}

export function courseComplete(s: CourseState): boolean {
  return s.unlockedCount >= orderOf(s).length;
}

// ── mutations (pure: return a new CourseState) ─────────────────────────────

export function freshMastery(ch: string): CharMastery {
  return {
    ch,
    introduced: false,
    reps: 0,
    lapses: 0,
    recallRate: 0,
    sendRate: 0,
    recentRecall: [],
    ease: 2.5,
    intervalDays: 0,
    dueAt: 0,
    bestCopyWpm: 0,
    lastSeen: 0,
  };
}

function clone(s: CourseState): CourseState {
  return {
    ...s,
    perChar: Object.fromEntries(
      Object.entries(s.perChar).map(([k, v]) => [k, { ...v, recentRecall: [...v.recentRecall] }]),
    ),
  };
}

export function introduceNextChar(s: CourseState): CourseState {
  const ch = nextLockedChar(s);
  if (!ch) return s;
  const next = clone(s);
  const m = freshMastery(ch);
  m.introduced = true;
  m.lastSeen = Date.now();
  m.dueAt = Date.now() + RELEARN_MS;
  next.perChar[ch] = m;
  next.unlockedCount += 1;
  return next;
}

function emaUpdate(prev: number, sample: number, hasHistory: boolean): number {
  return hasHistory ? prev + EMA_ALPHA * (sample - prev) : sample;
}

function rescheduleAfter(m: CharMastery, correct: boolean, now: number) {
  if (correct) {
    if (m.reps <= 1)
      m.intervalDays = m.intervalDays === 0 ? 0.04 : 1; // first hits stay short
    else if (m.intervalDays < 1) m.intervalDays = 1;
    else m.intervalDays = Math.min(180, Math.round(m.intervalDays * m.ease));
    m.ease = Math.min(3.0, m.ease + 0.06);
    m.dueAt = now + Math.max(RELEARN_MS, m.intervalDays * DAY_MS);
  } else {
    m.ease = Math.max(1.3, m.ease - 0.2);
    m.intervalDays = 0;
    m.lapses += 1;
    m.dueAt = now + RELEARN_MS;
  }
}

export function recordRecognition(s: CourseState, ch: string, correct: boolean): CourseState {
  const next = clone(s);
  const m = {
    ...(next.perChar[ch] ?? freshMastery(ch)),
    recentRecall: [...(next.perChar[ch]?.recentRecall ?? [])],
  };
  m.introduced = true;
  const had = m.reps > 0;
  m.reps += 1;
  m.recallRate = emaUpdate(m.recallRate, correct ? 1 : 0, had);
  m.recentRecall.push(correct);
  if (m.recentRecall.length > RECENT_WINDOW) m.recentRecall.shift();
  m.lastSeen = Date.now();
  rescheduleAfter(m, correct, Date.now());
  next.perChar[ch] = m;
  return next;
}

export function recordSend(s: CourseState, ch: string, correct: boolean): CourseState {
  const next = clone(s);
  const m = {
    ...(next.perChar[ch] ?? freshMastery(ch)),
    recentRecall: [...(next.perChar[ch]?.recentRecall ?? [])],
  };
  m.introduced = true;
  const had = m.reps > 0;
  m.reps += 1;
  m.sendRate = emaUpdate(m.sendRate, correct ? 1 : 0, had);
  m.lastSeen = Date.now();
  // sending counts toward the review schedule too, just more gently
  if (!correct) {
    m.dueAt = Math.min(m.dueAt, Date.now() + RELEARN_MS);
  }
  next.perChar[ch] = m;
  return next;
}

/** Record copy of a whole word (audio → typed). Updates recognition per char. */
export function recordWordCopy(
  s: CourseState,
  word: string,
  perCharCorrect: Record<string, boolean[]>,
): CourseState {
  let next = s;
  for (const [ch, results] of Object.entries(perCharCorrect)) {
    for (const ok of results) next = recordRecognition(next, ch, ok);
  }
  void word;
  return next;
}

export interface SessionSummary {
  /** recognition + copy accuracy across the whole session, 0..1 */
  accuracy: number;
  /** wall-clock minutes spent */
  minutes: number;
  /** characters newly introduced this session */
  introduced: string[];
  /** whether a checkpoint was passed */
  checkpointPassed?: boolean;
  /** head-copy effective speed achieved this session, if any */
  headCopyWpm?: number;
}

export function applySessionResult(s: CourseState, sum: SessionSummary): CourseState {
  const next = clone(s);
  const today = todayStr();
  // streak
  if (next.lastSessionDate) {
    const last = new Date(next.lastSessionDate + "T00:00:00");
    const now = new Date(today + "T00:00:00");
    const diffDays = Math.round((now.getTime() - last.getTime()) / DAY_MS);
    if (diffDays === 0) {
      /* same day, streak unchanged */
    } else if (diffDays === 1) next.streakDays += 1;
    else next.streakDays = 1;
  } else {
    next.streakDays = 1;
  }
  next.lastSessionDate = today;
  next.sessionsCompleted += 1;
  next.totalMinutes += Math.max(0, Math.round(sum.minutes));

  // Farnsworth ramp: two strong sessions in a row → +1 effective WPM, until it
  // meets character speed. A weak session resets the streak (no demotion).
  if (sum.accuracy >= 0.92) {
    next.goodSessionStreak += 1;
    if (next.goodSessionStreak >= 2 && next.effectiveWpm < next.characterWpm) {
      next.effectiveWpm = Math.min(next.characterWpm, next.effectiveWpm + 1);
      next.goodSessionStreak = 0;
    }
  } else if (sum.accuracy < 0.8) {
    next.goodSessionStreak = 0;
    next.effectiveWpm = Math.max(MIN_EFFECTIVE_WPM, next.effectiveWpm - 1);
  } else {
    next.goodSessionStreak = 0;
  }
  if (sum.headCopyWpm) next.headCopyWpm = Math.max(next.headCopyWpm, sum.headCopyWpm);
  return next;
}

/** Bump character speed once the learner is comfortably copying at full Farnsworth. */
export function canRaiseCharacterSpeed(s: CourseState): boolean {
  return s.effectiveWpm >= s.characterWpm && overallRecall(s) >= 0.93 && s.characterWpm < 35;
}

export function raiseCharacterSpeed(s: CourseState, by = 2): CourseState {
  const next = clone(s);
  next.characterWpm = Math.min(35, next.characterWpm + by);
  // keep effective a touch below the new character speed so spacing re-opens slightly
  next.effectiveWpm = Math.max(MIN_EFFECTIVE_WPM, Math.min(next.characterWpm, next.effectiveWpm));
  return next;
}

// ── small helpers for UI ───────────────────────────────────────────────────

export function courseStats(s: CourseState) {
  const unlocked = unlockedChars(s);
  const mastered = unlocked.filter((c) => isMastered(masteryOf(s, c))).length;
  const struggling = unlocked.filter((c) => isStruggling(masteryOf(s, c))).length;
  return {
    total: orderOf(s).length,
    unlocked: unlocked.length,
    mastered,
    struggling,
    allChars: ALL_COURSE_CHARS,
  };
}
