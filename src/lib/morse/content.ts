import { generateForRank, type Rank } from "./ranks";

export type ContentKind = "letters" | "words" | "sentences" | "numbers" | "ranks";

const COMMON_WORDS = [
  "the","of","and","to","in","is","you","that","it","he","was","for","on","are","as","with",
  "his","they","at","be","this","have","from","or","one","had","by","but","not","what",
  "all","were","we","when","your","can","said","there","use","an","each","which","she","do",
  "how","their","if","will","up","other","about","out","many","then","them","these","so","some",
  "her","would","make","like","him","into","time","has","look
