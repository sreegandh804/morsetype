// Morse timing math — single source of truth for symbol/gap durations.
//
// Two speeds matter:
//   • characterWpm — how fast the dits & dahs *sound* (and intra-character gaps).
//   • effectiveWpm — the overall PARIS speed once inter-letter / inter-word gaps
//     are stretched (Farnsworth). Always ≤ characterWpm.
//
// PARIS = "PARIS " = 50 dit-units. Of those, 31 units live *inside* characters
// (elements + 1-unit intra-character gaps) and 19 units are spacing (12 units of
// inter-letter gap + 7 units of inter-word gap). To keep characters at speed C
// while the whole word lands at speed S we stretch only the 19 spacing units:
//
//   ditC  = 1200 / C                          ms  (one unit at character speed)
//   ditF  = (60000 / S − 37200 / C) / 19      ms  (one unit of Farnsworth space)
//
// When S ≥ C there is no Farnsworth space — every unit is ditC.

export interface MorseTiming {
  /** ms per unit at character speed — used for dits, dahs, intra-character gaps. */
  ditC: number;
  /** ms per unit of inter-letter / inter-word spacing (≥ ditC when Farnsworth). */
  ditF: number;
  /** ms for a dit. */
  dit: number;
  /** ms for a dah. */
  dah: number;
  /** ms gap between symbols inside a character. */
  intraGap: number;
  /** ms gap between letters. */
  letterGap: number;
  /** ms gap between words. */
  wordGap: number;
  characterWpm: number;
  effectiveWpm: number;
}

export function computeTiming(characterWpm: number, effectiveWpm?: number): MorseTiming {
  const C = Math.max(1, characterWpm);
  const S = Math.max(1, Math.min(effectiveWpm ?? C, C));
  const ditC = 1200 / C;
  const ditF = S >= C ? ditC : Math.max(ditC, (60000 / S - 37200 / C) / 19);
  return {
    ditC,
    ditF,
    dit: ditC,
    dah: ditC * 3,
    intraGap: ditC,
    letterGap: ditF * 3,
    wordGap: ditF * 7,
    characterWpm: C,
    effectiveWpm: S,
  };
}

/** Legacy bridge: a "unitMs" was the character-speed dit. Recover the WPM. */
export function wpmFromUnitMs(unitMs: number): number {
  return 1200 / Math.max(1, unitMs);
}

/** Duration (ms) it takes to send a single piece of text at the given timing. */
export function durationOfText(text: string, t: MorseTiming, code: Record<string, string>): number {
  let ms = 0;
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === " ") {
      ms += t.wordGap;
      continue;
    }
    const c = code[ch.toUpperCase()];
    if (!c) continue;
    for (let s = 0; s < c.length; s++) {
      ms += c[s] === "." ? t.dit : t.dah;
      if (s < c.length - 1) ms += t.intraGap;
    }
    if (i < chars.length - 1 && chars[i + 1] !== " ") ms += t.letterGap;
  }
  return ms;
}
