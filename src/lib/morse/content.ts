import { generateForRank, type Rank } from "./ranks";

export type ContentKind = "letters" | "words" | "sentences" | "numbers" | "ranks";

const COMMON_WORDS = "the of and to in is you that it he was for on are as with his they at be this have from or one had by but not what all were we when your can said there use an each which she do how their if will up other about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who its now find long down day did get come made may part".split(" ");

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

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const NUMS = "0123456789".split("");

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generate(kind: ContentKind, wordCount = 25, rank: Rank = "cadet"): string {
  switch (kind) {
    case "letters":
      return Array.from({ length: wordCount }, () => pick(LETTERS)).join(" ");
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
    case "ranks":
      return generateForRank(rank, wordCount);
  }
}