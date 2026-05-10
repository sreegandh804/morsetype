import type { InputScheme, GapMode } from "./useMorseInput";
import type { ContentKind } from "./content";

export interface Settings {
  scheme: InputScheme;
  gapMode: GapMode;
  unitMs: number;       // dit length, ms
  audio: boolean;
  showHints: boolean;   // Learn mode forces this on
  content: ContentKind;
  wordCount: number;
  mode: "learn" | "test";
}

export const DEFAULT_SETTINGS: Settings = {
  scheme: "two_key",
  gapMode: "auto",
  unitMs: 80, // ~15 wpm
  audio: true,
  showHints: false,
  content: "letters",
  wordCount: 25,
  mode: "learn",
};

const KEY = "morsetype.settings.v1";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

export function wpmFromUnit(unitMs: number) {
  // PARIS: 50 dit-units per word at given WPM => unitMs = 60000 / (50 * wpm) = 1200 / wpm
  return Math.round(1200 / unitMs);
}
export function unitFromWpm(wpm: number) {
  return Math.round(1200 / wpm);
}
