// Per-character mistake tracking, persisted to localStorage.
// Powers the Learn dashboard and the targeted "mistakes drill" content mode.

import { MORSE } from "./alphabet";

export interface CharStat {
  attempts: number;
  errors: number;
  lastSeen: number; // epoch ms
}

export type CharStats = Record<string, CharStat>;

export interface MistakeStore {
  stats: CharStats;
  totalAttempts: number;
  totalErrors: number;
  sessions: number;
  updatedAt: number;
}

const KEY = "morsetype.mistakes.v1";

const EMPTY: MistakeStore = {
  stats: {},
  totalAttempts: 0,
  totalErrors: 0,
  sessions: 0,
  updatedAt: 0,
};

export function loadMistakes(): MistakeStore {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return { ...EMPTY, ...parsed, stats: { ...(parsed?.stats ?? {}) } };
  } catch {
    return { ...EMPTY };
  }
}

function save(store: MistakeStore) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {}
}

/**
 * Record a batch of per-character outcomes from a finished test.
 * `target` and `errors` come straight from TypingTest state — same length,
 * spaces are skipped.
 */
export function recordSession(target: string, errors: boolean[]): MistakeStore {
  const store = loadMistakes();
  const now = Date.now();
  let touched = false;
  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    if (!ch || ch === " ") continue;
    const key = ch.toUpperCase();
    const prev = store.stats[key] ?? { attempts: 0, errors: 0, lastSeen: 0 };
    const isError = !!errors[i];
    store.stats[key] = {
      attempts: prev.attempts + 1,
      errors: prev.errors + (isError ? 1 : 0),
      lastSeen: now,
    };
    store.totalAttempts += 1;
    if (isError) store.totalErrors += 1;
    touched = true;
  }
  if (touched) {
    store.sessions += 1;
    store.updatedAt = now;
    save(store);
  }
  return store;
}

export function resetMistakes() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(KEY); } catch {}
}

export interface CharScore {
  char: string;
  attempts: number;
  errors: number;
  errorRate: number;   // 0..1
  mastery: number;     // 0..1, blends accuracy and exposure
}

const MASTERY_TARGET_ATTEMPTS = 10;

export function scoreChar(stat: CharStat | undefined): CharScore {
  const attempts = stat?.attempts ?? 0;
  const errors = stat?.errors ?? 0;
  const errorRate = attempts ? errors / attempts : 0;
  // Accuracy * exposure — both must be high to be "mastered".
  const accuracy = attempts ? 1 - errorRate : 0;
  const exposure = Math.min(1, attempts / MASTERY_TARGET_ATTEMPTS);
  const mastery = accuracy * exposure;
  return { char: "", attempts, errors, errorRate, mastery };
}

/** All letters A–Z plus 0–9 scored by current mastery. */
export function alphabetScores(store: MistakeStore = loadMistakes()): CharScore[] {
  const chars = Object.keys(MORSE).filter(k => /^[A-Z0-9]$/.test(k));
  return chars.map(c => ({ ...scoreChar(store.stats[c]), char: c }));
}

/**
 * Pick the N most-troublesome chars. Prioritises high error-rate among chars
 * the user has actually attempted; falls back to untried letters when needed.
 */
export function weakChars(n = 8, store: MistakeStore = loadMistakes()): CharScore[] {
  const scored = alphabetScores(store);
  const tried = scored.filter(s => s.attempts > 0);
  // Sort by error rate desc, then by attempts desc (more attempts = more confidence in the rate).
  tried.sort((a, b) => b.errorRate - a.errorRate || b.attempts - a.attempts);
  const trouble = tried.filter(s => s.errorRate > 0).slice(0, n);
  return trouble;
}

export interface OverallStats {
  attempted: number;
  mastered: number;
  total: number;
  accuracy: number;        // 0..100
  totalAttempts: number;
  totalErrors: number;
  sessions: number;
}

const MASTERY_THRESHOLD = 0.85;

export function overallStats(store: MistakeStore = loadMistakes()): OverallStats {
  const scored = alphabetScores(store);
  const attempted = scored.filter(s => s.attempts > 0).length;
  const mastered = scored.filter(s => s.mastery >= MASTERY_THRESHOLD).length;
  const acc = store.totalAttempts
    ? ((store.totalAttempts - store.totalErrors) / store.totalAttempts) * 100
    : 0;
  return {
    attempted,
    mastered,
    total: scored.length,
    accuracy: acc,
    totalAttempts: store.totalAttempts,
    totalErrors: store.totalErrors,
    sessions: store.sessions,
  };
}

export const MASTERY = {
  threshold: MASTERY_THRESHOLD,
  targetAttempts: MASTERY_TARGET_ATTEMPTS,
};
