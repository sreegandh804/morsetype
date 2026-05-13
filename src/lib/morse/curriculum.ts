import { MORSE } from "./alphabet";

// ── Teaching orders ────────────────────────────────────────────────────────
//
// Koch's method: introduce characters one at a time, always at full character
// speed, only advancing when accuracy on everything so far is ≥ 90%. The order
// below interleaves "opposite-sounding" characters early so the ear learns to
// discriminate rather than count. (LCWO / G4FON-style ordering.)

export const KOCH_ORDER: string[] = [
  "K",
  "M",
  "R",
  "S",
  "U",
  "A",
  "P",
  "T",
  "L",
  "O",
  "W",
  "I",
  ".",
  "N",
  "J",
  "E",
  "F",
  "0",
  "Y",
  ",",
  "V",
  "G",
  "5",
  "/",
  "Q",
  "9",
  "Z",
  "H",
  "8",
  "B",
  "?",
  "4",
  "2",
  "7",
  "C",
  "1",
  "D",
  "6",
  "X",
  "3",
  "=",
];

// Gentler ramp for younger / first-time learners: high-frequency, short codes
// first, hard ones (X Q Z, then digits, then punctuation) last.
export const EASY_START_ORDER: string[] = [
  "E",
  "T",
  "A",
  "I",
  "N",
  "O",
  "S",
  "H",
  "R",
  "D",
  "L",
  "U",
  "C",
  "M",
  "W",
  "F",
  "G",
  "Y",
  "P",
  "B",
  "V",
  "K",
  "J",
  "X",
  "Q",
  "Z",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  ".",
  ",",
  "?",
  "/",
  "=",
];

export const ALPHABETICAL_ORDER: string[] = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."0123456789",
  ".",
  ",",
  "?",
  "/",
  "=",
];

export type TeachingOrderKey = "koch" | "easy" | "alphabetical";

export const TEACHING_ORDERS: Record<
  TeachingOrderKey,
  { label: string; blurb: string; order: string[] }
> = {
  koch: {
    label: "Koch",
    blurb: "the proven order — opposites early, hardest last",
    order: KOCH_ORDER,
  },
  easy: {
    label: "easy start",
    blurb: "common letters first, gentle ramp",
    order: EASY_START_ORDER,
  },
  alphabetical: {
    label: "A → Z",
    blurb: "straight through the alphabet",
    order: ALPHABETICAL_ORDER,
  },
};

// ── Per-character lessons ──────────────────────────────────────────────────

export interface CharLesson {
  ch: string; // uppercase letter / digit / punctuation
  code: string; // ".-" etc, from MORSE
  rhythm: string; // spoken rhythm, e.g. "di-DAH"
  word: string; // mnemonic word that *starts* with the character
  /** A phrase whose stressed-syllable rhythm matches the code (CW mnemonic). */
  phrase: string;
  /** Characters this one is most often confused with — used for targeted drills. */
  confuse: string[];
  /** Plain-language hint shown on the introduce card. */
  hint: string;
}

/** Render a code into a spoken rhythm string: dit → "di"/"dit", dah → "DAH". */
export function rhythmOf(code: string): string {
  const parts = [...code].map((s, i) => {
    if (s === ".") return i === code.length - 1 ? "dit" : "di";
    return "DAH";
  });
  return parts.join("-");
}

// word + phrase + confusions per character. Codes come from MORSE.
const SPEC: Record<string, Omit<CharLesson, "ch" | "code" | "rhythm">> = {
  A: {
    word: "Apple",
    phrase: "a-BOUT",
    confuse: ["N", "W", "R"],
    hint: "short then long — the start of the alphabet, the start of everything.",
  },
  B: {
    word: "Boot",
    phrase: "BAD-boy-bad-boy",
    confuse: ["D", "V", "6"],
    hint: "one long, then three shorts. The mirror of V.",
  },
  C: {
    word: "Coca-Cola",
    phrase: "CO-ca-CO-la",
    confuse: ["K", "Y", "Q"],
    hint: "long-short-long-short — a steady seesaw.",
  },
  D: {
    word: "Dog",
    phrase: "DOG-did-it",
    confuse: ["B", "U", "K", "X"],
    hint: "one long, two shorts. Half of B.",
  },
  E: {
    word: "Egg",
    phrase: "eh",
    confuse: ["I", "T"],
    hint: "the shortest of all — a single dit.",
  },
  F: {
    word: "Fiddle",
    phrase: "did-it-FUM-ble",
    confuse: ["L", "R", "U"],
    hint: "two shorts, a long, a short — the flip of L.",
  },
  G: {
    word: "Golf",
    phrase: "GOOD-GOLLY-miss",
    confuse: ["W", "Q", "M", "O"],
    hint: "two longs then a short. Q without its dah.",
  },
  H: {
    word: "House",
    phrase: "hippity-hippity",
    confuse: ["S", "5", "I"],
    hint: "four shorts in a row — a little pitter-patter.",
  },
  I: {
    word: "Igloo",
    phrase: "i-tip",
    confuse: ["E", "S", "M"],
    hint: "two shorts. E said twice.",
  },
  J: {
    word: "Jaguar",
    phrase: "ja-LONG-LONG-LONG",
    confuse: ["W", "P", "1"],
    hint: "short, then three longs — it leaps.",
  },
  K: {
    word: "Kangaroo",
    phrase: "KAN-ga-ROO",
    confuse: ["C", "R", "Y"],
    hint: "long-short-long. The 'go ahead' of the airwaves.",
  },
  L: {
    word: "Lollipop",
    phrase: "to-LONG-it-is",
    confuse: ["F", "R", "W"],
    hint: "short, long, short, short — F turned around.",
  },
  M: { word: "Moon", phrase: "MMM-MMM", confuse: ["O", "T", "N"], hint: "two longs. Half of O." },
  N: {
    word: "Nut",
    phrase: "NO-go",
    confuse: ["A", "D", "M"],
    hint: "long then short. A backwards.",
  },
  O: {
    word: "Owl",
    phrase: "OH-MY-GOSH",
    confuse: ["M", "G", "0"],
    hint: "three longs — wide open, like the letter.",
  },
  P: {
    word: "Penguin",
    phrase: "a-POOR-POOR-boy",
    confuse: ["J", "W", "X", "6"],
    hint: "short, long, long, short — bookended by dits.",
  },
  Q: {
    word: "Queen",
    phrase: "GOD-SAVE-the-QUEEN",
    confuse: ["G", "Y", "C"],
    hint: "long, long, short, long — regal and uneven.",
  },
  R: {
    word: "Robot",
    phrase: "ro-TA-tion",
    confuse: ["A", "L", "W", "K"],
    hint: "short, long, short — A with a tail.",
  },
  S: {
    word: "Snake",
    phrase: "sip-sip-sip",
    confuse: ["H", "I", "U", "5"],
    hint: "three shorts — a quick hiss.",
  },
  T: { word: "Tree", phrase: "TALL", confuse: ["E", "M", "N"], hint: "one long. The single dah." },
  U: {
    word: "Unicorn",
    phrase: "u-ni-FORM",
    confuse: ["A", "V", "S", "D"],
    hint: "short, short, long — picks up a dah at the end.",
  },
  V: {
    word: "Violin",
    phrase: "did-it-did-it-DUM",
    confuse: ["U", "B", "S", "4"],
    hint: "three shorts, one long — Beethoven's Fifth.",
  },
  W: {
    word: "Wave",
    phrase: "the-LONG-WAY-home",
    confuse: ["A", "R", "P", "G", "J"],
    hint: "short, long, long — A growing taller.",
  },
  X: {
    word: "X-ray",
    phrase: "X-marks-the-SPOT",
    confuse: ["B", "D", "K", "/"],
    hint: "long, short, short, long — a long sandwich.",
  },
  Y: {
    word: "Yo-yo",
    phrase: "YANK-the-LONG-ROPE",
    confuse: ["C", "K", "Q"],
    hint: "long, short, long, long. K with a dah glued on.",
  },
  Z: {
    word: "Zebra",
    phrase: "ZINC-ZINC-did-it",
    confuse: ["G", "Q", "7"],
    hint: "two longs, two shorts — the mirror of B.",
  },
  "0": {
    word: "zero",
    phrase: "LONG-LONG-LONG-LONG-LONG",
    confuse: ["O", "9"],
    hint: "five longs. A complete circle.",
  },
  "1": {
    word: "one",
    phrase: "one-LONG-LONG-LONG-LONG",
    confuse: ["J", "2"],
    hint: "one short, then four longs — climbing up from 0.",
  },
  "2": {
    word: "two",
    phrase: "two-bits-LONG-LONG-LONG",
    confuse: ["1", "3", "U"],
    hint: "two shorts, three longs.",
  },
  "3": {
    word: "three",
    phrase: "three-bits-here-LONG-LONG",
    confuse: ["2", "4", "V"],
    hint: "three shorts, two longs.",
  },
  "4": {
    word: "four",
    phrase: "four-bits-here-now-LONG",
    confuse: ["3", "5", "V", "H"],
    hint: "four shorts, one long.",
  },
  "5": {
    word: "five",
    phrase: "five-bits-here-now-folks",
    confuse: ["4", "H", "S"],
    hint: "five shorts — the all-dit number.",
  },
  "6": {
    word: "six",
    phrase: "LONG-six-bits-here-now",
    confuse: ["5", "7", "B"],
    hint: "one long, then five shorts — the count flips.",
  },
  "7": {
    word: "seven",
    phrase: "LONG-LONG-bits-here-now",
    confuse: ["6", "8", "Z"],
    hint: "two longs, three shorts.",
  },
  "8": {
    word: "eight",
    phrase: "LONG-LONG-LONG-bits-now",
    confuse: ["7", "9", "B"],
    hint: "three longs, two shorts.",
  },
  "9": {
    word: "nine",
    phrase: "LONG-LONG-LONG-LONG-bits",
    confuse: ["8", "0", "O"],
    hint: "four longs, one short — almost the full circle.",
  },
  ".": {
    word: "period",
    phrase: "did-DAH-did-DAH-did-DAH",
    confuse: ["+", ",", "S"],
    hint: "alternating short-long, three times — a tidy full stop.",
  },
  ",": {
    word: "comma",
    phrase: "DAH-DAH-bit-bit-DAH-DAH",
    confuse: [".", "?"],
    hint: "two longs, two shorts, two longs — symmetrical.",
  },
  "?": {
    word: "question",
    phrase: "did-it-DAH-DAH-did-it",
    confuse: [",", "X", "U"],
    hint: "two shorts, two longs, two shorts — bookended by dits.",
  },
  "/": {
    word: "slash",
    phrase: "DAH-did-it-DAH-bit",
    confuse: ["X", "-", "B"],
    hint: "long, short, short, long, short — splits a callsign.",
  },
  "=": {
    word: "break",
    phrase: "DAH-did-it-it-DAH",
    confuse: ["B", "X"],
    hint: "long, three shorts, long — the 'BT' separator (=).",
  },
};

export const CHAR_LESSONS: Record<string, CharLesson> = Object.fromEntries(
  Object.entries(SPEC).map(([ch, s]) => {
    const code = MORSE[ch];
    return [ch, { ch, code, rhythm: rhythmOf(code), ...s }];
  }),
);

/** Every character the course can teach, in canonical order (Koch). */
export const ALL_COURSE_CHARS: string[] = KOCH_ORDER.filter((c) => CHAR_LESSONS[c]);

export function lessonFor(ch: string): CharLesson | undefined {
  return CHAR_LESSONS[ch.toUpperCase()];
}
