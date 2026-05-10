import { weakChars } from "./mistakes";

export type ContentKind =
  | "letters"
  | "words"
  | "sentences"
  | "tongue_twisters"
  | "numbers"
  | "drill";

const COMMON_WORDS = [
  "the","of","and","to","in","is","you","that","it","he","was","for","on","are","as","with",
  "his","they","at","be","this","have","from","or","one","had","by","word","but","not","what",
  "all","were","we","when","your","can","said","there","use","an","each","which","she","do",
  "how","their","if","will","up","other","about","out","many","then","them","these","so","some",
  "her","would","make","like","him","into","time","has","look","two","more","write","go","see",
  "number","no","way","could","people","my","than","first","water","been","call","who","its","now",
  "find","long","down","day","did","get","come","made","may","part",
];

const SENTENCES = [
  "the quick brown fox jumps over the lazy dog",
  "all that glitters is not gold",
  "a journey of a thousand miles begins with a single step",
  "the only way to do great work is to love what you do",
  "what we think we become",
  "the best time to plant a tree was twenty years ago",
  "in the middle of difficulty lies opportunity",
  "stay hungry stay foolish",
  "imagination is more important than knowledge",
];

const TONGUE_TWISTERS = [
  "she sells seashells by the seashore",
  "peter piper picked a peck of pickled peppers",
  "how much wood would a woodchuck chuck",
  "red lorry yellow lorry red lorry yellow lorry",
  "fuzzy wuzzy was a bear fuzzy wuzzy had no hair",
  "betty bought a bit of bitter butter",
  "a proper copper coffee pot",
];

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const NUMS = "0123456789".split("");

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generate(kind: ContentKind, wordCount = 25): string {
  switch (kind) {
    case "letters":
      return Array.from({ length: wordCount * 3 }, () => pick(LETTERS)).join(" ");
    case "numbers":
      return Array.from({ length: wordCount }, () =>
        Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => pick(NUMS)).join(""),
      ).join(" ");
    case "words":
      return Array.from({ length: wordCount }, () => pick(COMMON_WORDS)).join(" ");
    case "sentences": {
      const out: string[] = [];
      while (out.join(" ").split(/\s+/).length < wordCount) out.push(pick(SENTENCES));
      return out.join(" ");
    }
    case "tongue_twisters": {
      const out: string[] = [];
      while (out.join(" ").split(/\s+/).length < wordCount) out.push(pick(TONGUE_TWISTERS));
      return out.join(" ");
    }
    case "drill":
      return generateDrill(wordCount);
  }
}

/**
 * Weighted drill: heavily samples the user's weakest characters, mixes in a
 * little random alphabet for context. Falls back to plain letters when there
 * is no error history yet.
 */
export function generateDrill(wordCount = 25): string {
  const weak = weakChars(8);
  const pool: string[] = [];
  if (weak.length === 0) {
    return Array.from({ length: wordCount * 3 }, () => pick(LETTERS)).join(" ");
  }
  // Weight each weak char by its error rate (min 2 copies, scaled up to 8).
  for (const w of weak) {
    const copies = Math.max(2, Math.min(8, Math.round(w.errorRate * 10)));
    for (let i = 0; i < copies; i++) pool.push(w.char.toLowerCase());
  }
  // Sprinkle a few random letters so the drill isn't pure repetition.
  for (let i = 0; i < weak.length; i++) pool.push(pick(LETTERS));

  const total = wordCount * 3;
  const out: string[] = [];
  for (let i = 0; i < total; i++) {
    // Avoid two of the same char in a row — feels more like real practice.
    let c = pick(pool);
    if (out.length && out[out.length - 1] === c) c = pick(pool);
    out.push(c);
  }
  // Group into 3-char "words" for readable spacing.
  const grouped: string[] = [];
  for (let i = 0; i < out.length; i += 3) grouped.push(out.slice(i, i + 3).join(""));
  return grouped.join(" ");
}
