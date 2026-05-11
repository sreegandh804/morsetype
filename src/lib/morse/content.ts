import { generateForRank, type Rank } from "./ranks";

export type ContentKind = "letters" | "words" | "sentences" | "numbers" | "ranks";

const COMMON_WORDS = [
  "the","of","and","to","in","is","you","that","it","he","was","for","on","are","as","with",
  "his","they","at","be","this","have","from","or","one","had","by","word
