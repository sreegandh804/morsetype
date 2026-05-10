// International Morse + per-language adaptations live in ./languages.
// This module keeps the historical `MORSE` / `REVERSE_MORSE` exports (English /
// ITU-R M.1677) and adds helpers for resolving language-specific tables.
import { getLanguage } from "./languages";

const ENGLISH = getLanguage("english");

export const MORSE: Record<string, string> = ENGLISH.morse;

export const REVERSE_MORSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE).map(([k, v]) => [v, k]),
);

export function getMorseMap(langId: string): Record<string, string> {
  return getLanguage(langId).morse;
}

export function getReverseMorse(langId: string): Record<string, string> {
  const lang = getLanguage(langId);
  return Object.fromEntries(Object.entries(lang.morse).map(([k, v]) => [v, k]));
}

export function encodeChar(c: string, langId = "english"): string | null {
  const m = getMorseMap(langId);
  return m[c] ?? m[c.toUpperCase()] ?? null;
}
