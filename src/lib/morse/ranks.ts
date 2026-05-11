import { unitFromWpm } from "./storage";

export type Rank = "cadet" | "operator" | "sparks" | "chief";

export interface RankConfig {
  key: Rank;
  label: string;
  blurb: string;
  minWpm: number;
  unitMsFloor: number;
  prosigns: string[];
  punctuation: string[];
}

export const RANKS: RankConfig[] = [
  {
    key: "cadet",
    label: "cadet",
    blurb: "letters · short common words",
    minWpm: 10,
    unitMsFloor: unitFromWpm(10),
    prosigns: [],
    punctuation: [],
  },
  {
    key: "operator",
    label: "operator",
    blurb: "common words · short sentences",
    minWpm: 15,
    unitMsFloor: unitFromWpm(15),
    prosigns: [],
    punctuation: [".", ","],
  },
  {
    key: "sparks",
    label: "sparks",
    blurb: "sentences · numbers · callsigns",
    minWpm: 20,
    unitMsFloor: unitFromWpm(20),
    prosigns: ["<AR>", "<BT>"],
    punctuation: [".", ",", "?", "/"],
  },
  {
    key: "chief",
    label: "chief radioman",
    blurb: "long-form · q-codes · prosigns",
    minWpm: 25,
    unitMsFloor: unitFromWpm(25),
    prosigns: ["<AR>", "<BT>", "<SK>", "<KN>"],
    punctuation: [".", ",", "?", "/", "=", ":"],
  },
];

export function getRank(key: Rank): RankConfig {
  return RANKS.find((r) => r.key === key) ?? RANKS[0];
}

const SHORT_WORDS = ["the","of","and","to","in","is","you","it","he","we","on","at","be","by","or","so","do","go","up","my","an"];
const COMMON_WORDS = ["the","of","and","to","in","is","you","that","it","he","was","for","on","are","as","with","his","they","at","be","this","have","from","or","one","had","by","but","not","what","all","were","we","when","your","can","said","there","use","an","each","which","she","do","how","their","if","will","up","other","about","out","many","then","them","these","so","some"];
const SHORT_SENTENCES = [
  "the quick brown fox",
  "wind from the north",
  "all is well over",
  "send help at dawn",
  "stay hungry stay foolish",
];
const LONG_SENTENCES = [
  "in the middle of difficulty lies opportunity",
  "the best time to plant a tree was twenty years ago",
  "imagination is more important than knowledge",
  "the only way to do great work is to love what you do",
  "calling all stations this is a routine test transmission",
];
const CALLSIGNS = ["W1AW","K3LR","G0XYZ","VK2ABC","JA1NUT","DL4MEA","F6BCC","ZL2RX","VE3AT","N5KO"];
const QCODES = ["QTH","QSL","QRZ","QSY","QRM","QRN","QSB","QRP","QRO","QRT"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function letter(): string {
  return "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
}
function number(): string {
  const n = 2 + Math.floor(Math.random() * 4);
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

export function generateForRank(rank: Rank, wordCount = 25): string {
  const cfg = getRank(rank);
  const out: string[] = [];

  function maybePunct(): string {
    if (cfg.punctuation.length === 0) return "";
    if (Math.random() < 0.18) return pick(cfg.punctuation);
    return "";
  }
  function maybeProsign(): string | null {
    if (cfg.prosigns.length === 0) return null;
    if (Math.random() < 0.08) return pick(cfg.prosigns).toLowerCase();
    return null;
  }

  while (out.join(" ").split(/\s+/).filter(Boolean).length < wordCount) {
    const ps = maybeProsign();
    if (ps) { out.push(ps); continue; }
    const r = Math.random();
    switch (cfg.key) {
      case "cadet":
        if (r < 0.45) out.push(letter());
        else out.push(pick(SHORT_WORDS));
        break;
      case "operator":
        if (r < 0.7) out.push(pick(COMMON_WORDS) + maybePunct());
        else out.push(pick(SHORT_SENTENCES));
        break;
      case "sparks":
        if (r < 0.5) out.push(pick(LONG_SENTENCES));
        else if (r < 0.75) out.push(pick(CALLSIGNS).toLowerCase());
        else out.push(number());
        break;
      case "chief":
        if (r < 0.4) out.push(pick(LONG_SENTENCES) + maybePunct());
        else if (r < 0.6) out.push(pick(QCODES).toLowerCase());
        else if (r < 0.8) out.push(pick(CALLSIGNS).toLowerCase());
        else out.push(number());
        break;
    }
  }
  return out.join(" ");
}
