// PARIS standard: a word = 50 dit-units. Net WPM = (correct typed chars / 5) / minutes elapsed.
// `correctChars` must already exclude mistakes — the typed portion minus errors — so the
// live speed stat reflects real forward progress rather than raw key-presses.
export function calcWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || correctChars <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return (correctChars / 5) / minutes;
}
// Characters-per-minute on the same basis: typed portion, excluding mistakes.
export function calcCpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || correctChars <= 0) return 0;
  return correctChars / (elapsedMs / 60000);
}
export function calcAccuracy(correct: number, total: number): number {
  if (total <= 0) return 100;
  return (correct / total) * 100;
}
