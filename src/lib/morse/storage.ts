import type { InputScheme, GapMode } from "./useMorseInput";
import type { ContentKind } from "./content";
import type { Waveform } from "./audio";

export type Theme = "serika" | "telegraph" | "midnight" | "radiosport";
export type Realism = "practice" | "authentic" | "sparks" | "custom";

export interface RealismPreset {
  unitMs: number;
  dahThresholdUnits: number;
  label: string;
  blurb: string;
}

export const REALISM_PRESETS: Record<Exclude<Realism, "custom">, RealismPreset> = {
  practice: {
    unitMs: 140,
    dahThresholdUnits: 2.5,
    label: "practice",
    blurb: "slow & forgiving · ~9 wpm",
  },
  authentic: {
    unitMs: 80,
    dahThresholdUnits: 2,
    label: "authentic",
    blurb: "real shipboard cadence · ~15 wpm",
  },
  sparks: {
    unitMs: 50,
    dahThresholdUnits: 1.8,
    label: "sparks",
    blurb: "fast operator · ~24 wpm",
  },
};

export interface Settings {
  scheme: InputScheme;
  gapMode: GapMode;
  unitMs: number; // dit length, ms
  // dah threshold for single-key (paddle) input, expressed in dit-units
  dahThresholdUnits: number;
  // current realism preset (or "custom" if user tweaked manually)
  realism: Realism;
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
  /** Receive character (element) speed in WPM. */
  characterWpm: number;
  /** Receive overall (PARIS) speed in WPM. Must be ≤ characterWpm. */
  effectiveWpm: number;
}

export const DEFAULT_SETTINGS: Settings = {
  scheme: "two_key",
  gapMode: "auto",
  unitMs: REALISM_PRESETS.authentic.unitMs,
  dahThresholdUnits: REALISM_PRESETS.authentic.dahThresholdUnits,
  realism: "authentic",
  audio: true,
  pitchHz: 600,
  showHints: true,
  content: "letters",
  wordCount: 25,
  theme: "serika",
  audioMode: "tone",
  waveform: "sine",
  vintage: false,
  showKey: true,
  decodeAudioOnly: false,
  characterWpm: 20,
  effectiveWpm: 20,
};

const KEY = "morsetype.settings.v1";

const VALID_CONTENT: ContentKind[] = ["letters", "words", "sentences", "numbers"];

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings> & { decodeFarnsworth?: boolean };
    const merged = { ...DEFAULT_SETTINGS, ...parsed } as Settings;
    // Migrate legacy boolean Farnsworth → 18/10 wpm split when on.
    if (parsed.decodeFarnsworth != null && parsed.characterWpm == null) {
      if (parsed.decodeFarnsworth) {
        merged.characterWpm = 18;
        merged.effectiveWpm = 10;
      }
    }
    if (merged.effectiveWpm > merged.characterWpm) merged.effectiveWpm = merged.characterWpm;
    // a stored "ranks"/"course" content kind is no longer valid — fall back
    if (!VALID_CONTENT.includes(merged.content)) merged.content = DEFAULT_SETTINGS.content;
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Resolve a realism preset → Settings patch (unit + dah threshold). */
export function applyRealism(name: Exclude<Realism, "custom">): Partial<Settings> {
  const p = REALISM_PRESETS[name];
  return { realism: name, unitMs: p.unitMs, dahThresholdUnits: p.dahThresholdUnits };
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
