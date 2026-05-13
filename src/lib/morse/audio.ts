// Audio engine — beep (sidetone), clack (sounder), with optional vintage filter.

let ctx: AudioContext | null = null;
let vintageIR: AudioBuffer | null = null;
let masterBus: GainNode | null = null;
let analyser: AnalyserNode | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as
      | typeof AudioContext
      | undefined;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function getBus(c: AudioContext): GainNode {
  if (!masterBus) {
    masterBus = c.createGain();
    masterBus.gain.value = 1;
    analyser = c.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.05;
    masterBus.connect(analyser);
    analyser.connect(c.destination);
  }
  return masterBus;
}

/** Returns a shared AnalyserNode that observes everything routed through the master bus. */
export function getAudioAnalyser(): AnalyserNode | null {
  const c = getCtx();
  if (!c) return null;
  getBus(c);
  return analyser;
}

function buildVintageIR(c: AudioContext): AudioBuffer {
  if (vintageIR) return vintageIR;
  const len = Math.floor(c.sampleRate * 0.18);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3) * 0.4;
    }
  }
  vintageIR = buf;
  return buf;
}

const ATTACK_S = 0.008;
const RELEASE_S = 0.012;
const FLOOR = 0.0001;

export type Waveform = "sine" | "square" | "triangle";

export interface ToneOptions {
  freq?: number;
  volume?: number;
  waveform?: Waveform;
  vintage?: boolean;
}

function destinationOf(c: AudioContext, vintage: boolean): AudioNode {
  const bus = getBus(c);
  if (!vintage) return bus;
  // Build vintage chain once-ish via lazy nodes per call (cheap).
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 650;
  bp.Q.value = 4.5;
  const conv = c.createConvolver();
  conv.buffer = buildVintageIR(c);
  const wet = c.createGain();
  wet.gain.value = 0.18;
  bp.connect(bus);
  bp.connect(conv);
  conv.connect(wet);
  wet.connect(bus);
  return bp;
}

export function beep(durationMs: number, opts: ToneOptions | number = 600, volumeArg = 0.15) {
  const c = getCtx();
  if (!c) return;
  const o: ToneOptions =
    typeof opts === "number" ? { freq: opts, volume: volumeArg } : opts;
  const freq = o.freq ?? 600;
  const volume = o.volume ?? 0.15;
  const waveform = o.waveform ?? "sine";

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.frequency.value = freq;
  osc.type = waveform;
  osc.connect(gain);
  gain.connect(destinationOf(c, !!o.vintage));

  const now = c.currentTime;
  const dur = Math.max(durationMs / 1000, ATTACK_S + RELEASE_S + 0.002);

  gain.gain.setValueAtTime(FLOOR, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + ATTACK_S);
  gain.gain.setValueAtTime(volume, now + dur - RELEASE_S);
  gain.gain.exponentialRampToValueAtTime(FLOOR, now + dur);

  osc.start(now);
  osc.stop(now + dur + 0.02);
}

// Filtered noise burst — mechanical telegraph sounder click.
function noiseBurst(c: AudioContext, when: number, ms: number, volume: number, kind: "down" | "up", vintage: boolean) {
  const len = Math.max(1, Math.floor((c.sampleRate * ms) / 1000));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = kind === "down" ? 1900 : 1400;
  bp.Q.value = 1.6;
  const g = c.createGain();
  g.gain.setValueAtTime(FLOOR, when);
  g.gain.exponentialRampToValueAtTime(volume, when + 0.0015);
  g.gain.exponentialRampToValueAtTime(FLOOR, when + ms / 1000);
  src.connect(bp);
  bp.connect(g);
  g.connect(destinationOf(c, vintage));
  src.start(when);
  src.stop(when + ms / 1000 + 0.01);
}

// Sounder: down-click at start, up-click at end of the symbol.
export function sounder(durationMs: number, opts: { volume?: number; vintage?: boolean } = {}) {
  const c = getCtx();
  if (!c) return;
  const v = opts.volume ?? 0.35;
  const now = c.currentTime;
  noiseBurst(c, now, 12, v, "down", !!opts.vintage);
  noiseBurst(c, now + durationMs / 1000, 9, v * 0.85, "up", !!opts.vintage);
}

// Unified emit for a single dit/dah symbol, given user audio settings.
export interface SymbolAudioOptions {
  audio: boolean;
  audioMode?: "tone" | "sounder";
  pitchHz: number;
  waveform?: Waveform;
  vintage?: boolean;
}
export function emitSymbol(s: "." | "-", unitMs: number, opts: SymbolAudioOptions) {
  if (!opts.audio) return;
  const dur = s === "." ? unitMs : unitMs * 3;
  if (opts.audioMode === "sounder") {
    sounder(dur, { vintage: opts.vintage });
  } else {
    beep(dur, { freq: opts.pitchHz, waveform: opts.waveform, vintage: opts.vintage });
  }
}
