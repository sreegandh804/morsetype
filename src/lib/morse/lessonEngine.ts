// Lesson engine — assembles one practice session from course state.
//
// A session is a short (default ~7 min) sequence of micro-activities the learner
// works through. The mix is driven by: due spaced-repetition reviews, the Koch
// gate (introduce at most one new character, only when accuracy ≥ 90%), and
// per-character weakness weighting. It always ends on something the learner is
// good at, and never runs longer than the target duration.

import { COMMON_WORDS } from "./content";
import { lessonFor } from "./curriculum";
import {
  type CourseState,
  unlockedChars,
  nextLockedChar,
  canIntroduceNext,
  dueReviews,
  masteryOf,
  isStruggling,
  isMastered,
  orderOf,
  masteryPct,
} from "./progress";

export type Activity =
  | { kind: "intro"; ch: string }
  | { kind: "recognize"; ch: string } // hear one character → name it
  | { kind: "send"; ch: string } // see a character → key it
  | { kind: "copyWord"; word: string; isGroup: boolean } // hear a word/group → type it (per-char echo ok)
  | { kind: "headCopy"; word: string } // hear a word → type it from memory, no echo
  | { kind: "checkpoint"; text: string; mode: "copy" | "send" };

export interface Session {
  activities: Activity[];
  estMinutes: number;
  introducedThisSession: string[];
  /** characters this session touches (for the pre-session summary) */
  focusChars: string[];
}

const EST_MS: Record<Activity["kind"], number> = {
  intro: 45_000,
  recognize: 5_500,
  send: 8_500,
  copyWord: 11_000,
  headCopy: 14_000,
  checkpoint: 45_000,
};

const HEAD_COPY_UNLOCKED_AT = 12; // characters unlocked before head-copy appears
const COPY_WORD_UNLOCKED_AT = 6;
const CHECKPOINT_EVERY = 5; // characters between checkpoints

function pick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}
function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** Words from the common-word list that use only `allowed` characters. */
export function wordsFromAlphabet(allowed: Set<string>, max = 200): string[] {
  return COMMON_WORDS.filter((w) => [...w.toUpperCase()].every((c) => allowed.has(c))).slice(
    0,
    max,
  );
}

/** A random 2–5 letter group drawn from `chars` — classic Koch copy practice. */
export function randomGroup(chars: string[], minLen = 2, maxLen = 5): string {
  const n = minLen + Math.floor(Math.random() * (maxLen - minLen + 1));
  return Array.from({ length: n }, () => pick(chars))
    .join("")
    .toLowerCase();
}

/** Weight a character for drilling: weaker / due / newer / struggling → higher. */
function weightOf(s: CourseState, ch: string, now: number): number {
  const m = masteryOf(s, ch);
  let w = 1;
  w += (1 - m.recallRate) * 3; // the wobblier, the more reps
  if (isStruggling(m)) w += 4;
  if (m.dueAt <= now) w += 2;
  if (m.reps < 6) w += 2; // freshly introduced
  if (isMastered(m)) w *= 0.4; // ease off the solid ones
  return w;
}

function weightedSample(s: CourseState, pool: string[], now: number): string {
  const weights = pool.map((c) => weightOf(s, c, now));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function bestKnown(s: CourseState, pool: string[]): string {
  return [...pool].sort((a, b) => masteryPct(masteryOf(s, b)) - masteryPct(masteryOf(s, a)))[0];
}

function estMinutes(acts: Activity[]): number {
  return Math.round(acts.reduce((a, b) => a + EST_MS[b.kind], 0) / 60_000);
}

/** Should this session end with a checkpoint? (every Nth character, once.) */
function checkpointDue(s: CourseState): boolean {
  if (s.unlockedCount < CHECKPOINT_EVERY) return false;
  return s.unlockedCount % CHECKPOINT_EVERY === 0;
}

export function buildSession(
  s: CourseState,
  opts?: { targetMinutes?: number; headCopy?: boolean },
): Session {
  const target = Math.max(2, opts?.targetMinutes ?? s.sessionMinutes);
  const budgetMs = target * 60_000;
  const now = Date.now();
  const acts: Activity[] = [];
  const introduced: string[] = [];
  const used = new Set<string>();

  const addBudget = () => acts.reduce((a, b) => a + EST_MS[b.kind], 0);
  const room = (next: Activity["kind"]) => addBudget() + EST_MS[next] <= budgetMs;

  // ── 1. brand-new course: bootstrap the first two characters ──────────────
  if (s.unlockedCount === 0) {
    const order = orderOf(s);
    const c1 = order[0],
      c2 = order[1];
    if (c1 && lessonFor(c1)) {
      acts.push({ kind: "intro", ch: c1 });
      introduced.push(c1);
      used.add(c1);
      for (let i = 0; i < 5; i++) acts.push({ kind: "recognize", ch: c1 });
      for (let i = 0; i < 3; i++) acts.push({ kind: "send", ch: c1 });
    }
    if (c2 && lessonFor(c2)) {
      acts.push({ kind: "intro", ch: c2 });
      introduced.push(c2);
      used.add(c2);
      const mix = [c1, c2].filter(Boolean);
      for (let i = 0; i < 8; i++) acts.push({ kind: "recognize", ch: pick(mix) });
      for (let i = 0; i < 4; i++) acts.push({ kind: "send", ch: pick(mix) });
    }
    return {
      activities: acts,
      estMinutes: estMinutes(acts),
      introducedThisSession: introduced,
      focusChars: [c1, c2].filter(Boolean),
    };
  }

  const unlocked = unlockedChars(s);

  // ── 2. spaced-repetition reviews come first ─────────────────────────────
  for (const ch of dueReviews(s, now)) {
    if (!room("recognize")) break;
    acts.push({ kind: "recognize", ch });
    used.add(ch);
  }

  // ── 3. maybe introduce one new character (Koch gate) ────────────────────
  if (canIntroduceNext(s) && room("intro")) {
    const newCh = nextLockedChar(s);
    if (newCh && lessonFor(newCh)) {
      acts.push({ kind: "intro", ch: newCh });
      introduced.push(newCh);
      used.add(newCh);
      const conf = (lessonFor(newCh)?.confuse ?? []).filter(
        (c) => unlocked.includes(c) || c === newCh,
      );
      const neighbours = [newCh, newCh, newCh, ...conf];
      for (let i = 0; i < 7 && room("recognize"); i++)
        acts.push({ kind: "recognize", ch: pick(neighbours) });
      for (let i = 0; i < 3 && room("send"); i++)
        acts.push({ kind: "send", ch: i === 0 ? newCh : pick(neighbours) });
    }
  }

  // ── 4. fill the rest: weighted recognize/send, then word/head-copy ──────
  const wordPool =
    unlocked.length >= COPY_WORD_UNLOCKED_AT ? wordsFromAlphabet(new Set(unlocked)) : [];
  const allowHeadCopy =
    (opts?.headCopy ?? true) && unlocked.length >= HEAD_COPY_UNLOCKED_AT && wordPool.length >= 6;
  let sinceWord = 0;

  while (room("recognize")) {
    sinceWord++;
    // every ~5 drills, slot a word/group/head-copy if we can
    if (sinceWord >= 5 && unlocked.length >= COPY_WORD_UNLOCKED_AT) {
      sinceWord = 0;
      if (allowHeadCopy && Math.random() < 0.4 && room("headCopy")) {
        const w = wordPool.length ? pick(wordPool) : randomGroup(unlocked, 3, 4);
        acts.push({ kind: "headCopy", word: w });
        continue;
      }
      if (room("copyWord")) {
        const useGroup = wordPool.length === 0 || Math.random() < 0.4;
        const w = useGroup ? randomGroup(unlocked) : pick(wordPool);
        acts.push({ kind: "copyWord", word: w, isGroup: useGroup });
        continue;
      }
    }
    const ch = weightedSample(s, unlocked, now);
    // bias ~2:1 toward recognition over sending
    if (Math.random() < 0.32 && room("send")) acts.push({ kind: "send", ch });
    else acts.push({ kind: "recognize", ch });
    used.add(ch);
  }

  // ── 5. checkpoint near the end, on milestone sessions ───────────────────
  if (checkpointDue(s)) {
    const useWords = wordPool.length >= 3;
    const text = useWords
      ? shuffle(wordPool).slice(0, 3).join(" ")
      : `${randomGroup(unlocked)} ${randomGroup(unlocked)} ${randomGroup(unlocked)}`;
    // trim a couple of trailing drills to make room
    while (acts.length && addBudget() + EST_MS.checkpoint > budgetMs) acts.pop();
    acts.push({ kind: "checkpoint", text, mode: Math.random() < 0.5 ? "copy" : "send" });
  }

  // ── 6. always end on a confidence-builder ───────────────────────────────
  acts.push({ kind: "recognize", ch: bestKnown(s, unlocked) });

  return {
    activities: acts,
    estMinutes: estMinutes(acts),
    introducedThisSession: introduced,
    focusChars: [...used],
  };
}

/** A standalone drill of one already-introduced character (from the skill map). */
export function buildSingleCharDrill(s: CourseState, ch: string): Session {
  const conf = (lessonFor(ch)?.confuse ?? []).filter((c) => unlockedChars(s).includes(c));
  const mix = [ch, ch, ch, ...conf];
  const acts: Activity[] = [];
  for (let i = 0; i < 12; i++) acts.push({ kind: "recognize", ch: pick(mix) });
  for (let i = 0; i < 5; i++) acts.push({ kind: "send", ch: i % 3 === 0 ? ch : pick(mix) });
  for (let i = 0; i < 4; i++) acts.push({ kind: "recognize", ch: pick(mix) });
  return {
    activities: acts,
    estMinutes: estMinutes(acts),
    introducedThisSession: [],
    focusChars: [...new Set(mix)],
  };
}
