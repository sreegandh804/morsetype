// PARIS standard: a word = 50 dit-units. WPM = (correct chars / 5) / minutes is text-WPM.
// We use Monkeytype-style: WPM = (correct chars / 5) / (elapsed minutes).
export function calcWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return (correctChars / 5) / minutes;
}
export function calcAccuracy(correct: number, total: number): number {
  if (total <= 0) return 100;
  return (correct / total) * 100;
}
