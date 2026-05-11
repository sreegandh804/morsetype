let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

const ATTACK_S = 0.008;
const RELEASE_S = 0.012;
const FLOOR = 0.0001;

export function beep(durationMs: number, freq = 600, volume = 0.15) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.frequency.value = freq;
  osc.type = "sine";
  osc.connect(gain);
  gain.connect(c.destination);

  const now = c.currentTime;
  const dur = Math.max(durationMs / 1000, ATTACK_S + RELEASE_S + 0.002);

  gain.gain.setValueAtTime(FLOOR, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + ATTACK_S);
  gain.gain.setValueAtTime(volume, now + dur - RELEASE_S);
  gain.gain.exponentialRampToValueAtTime(FLOOR, now + dur);

  osc.start(now);
  osc.stop(now + dur + 0.02);
}
