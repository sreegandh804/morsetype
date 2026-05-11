import { getLanguage } from "./languages";

export type ContentKind = "letters" | "words" | "sentences" | "tongue_twisters" | "numbers";

const DEFAULT_DIGITS = "0123456789".split("");

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generate(kind: ContentKind, wordCount = 25, langId = "english"): string {
  const lang = getLanguage(langId);
  const letters = lang.letters;
  const numbers = lang.numbers ?? DEFAULT_DIGITS;
  const words = lang.words;
  const sentences = lang.sentences ?? [];
  const twisters = lang.twisters ?? [];

  switch (kind) {
    case "letters":
      return Array.from({ length: wordCount }, () => pick(letters)).join(" ");
    case "numbers":
      return Array.from({ length: wordCount }, () =>
        Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => pick(numbers)).join(""),
      ).join(" ");
    case "words":
      return Array.from({ length: wordCount }, () => pick(words)).join(" ");
    case "sentences": {
      const pool = sentences.length ? sentences : [words.slice(0, 8).join(" ")];
      const out: string[] = [];
      while (out.join(" ").split(/\s+/).length < wordCount) out.push(pick(pool));
      return out.join(" ");
    }
    case "tongue_twisters": {
      const pool = twisters.length
        ? twisters
        : sentences.length
          ? sentences
          : [words.slice(0, 8).join(" ")];
      const out: string[] = [];
      while (out.join(" ").split(/\s+/).length < wordCount) out.push(pick(pool));
      return out.join(" ");
    }
  }
}
