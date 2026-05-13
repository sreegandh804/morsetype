import type { InputScheme, GapMode } from "./useMorseInput";
import type { ContentKind } from "./content";
import type { Waveform } from "./audio";

export type Theme = "serika" | "telegraph" | "midnight" | "radiosport";

export interface Settings {
  scheme: InputScheme;
  gapMode: GapMode;
  unitMs: number; // dit length, ms
  audio: boolean;
  pitchHz: number;
  showHints: boolean;
  content: ContentKind;
  wordCount: number;
  theme: Theme;
  // Telegraph audio
  audioMode: "tone" | "sounder";
  waveform: Waveform;
  vintage: boolean;
  // Telegraph key visual
  showKey: boolean;
  // Decode mode
  decodeAudioOnly: boolean;
  decodeFarnsworth: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  scheme: "two_key",
  gapMode: "auto",
  unitMs: 80, // ~15 wpm
  audio: true,
  pitchHz: 600,
  showHints: false,
  content: "letters",
  wordCount: 25,
  theme: "serika",
  audioMode: "tone",
  waveform: "sine",
  vintage: false,
  showKey: true,
  decodeAudioOnly: false,
  decodeFarnsworth: false,
};

const KEY = "morsetype.settings.v1";

const VALID_CONTENT: ContentKind[] = ["letters", "words", "sentences", "numbers"];

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const merged = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as Settings;
    // a stored "ranks"/"course" content kind is no longer valid — fall back
    if (!VALID_CONTENT.includes(merged.content)) merged.content = DEFAULT_SETTINGS.content;
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent("morsetype:settings-changed"));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export function wpmFromUnit(unitMs: number) {
  // PARIS: 50 dit-units per word at given WPM => unitMs = 60000 / (50 * wpm) = 1200 / wpm
  return Math.round(1200 / unitMs);
}
export function unitFromWpm(wpm: number) {
  return Math.round(1200 / wpm);
}
