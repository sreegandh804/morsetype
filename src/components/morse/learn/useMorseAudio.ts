import { useCallback, useEffect, useRef, useState } from "react";
import { play, type Playback } from "@/lib/morse/player";
import type { Settings } from "@/lib/morse/storage";
import { MORSE } from "@/lib/morse/alphabet";

/** Audio + speech helper for the learn module. Always sounds (the point is to listen). */
export function useMorseAudio(settings: Settings, characterWpm: number, effectiveWpm?: number) {
  const playbackRef = useRef<Playback | null>(null);
  const [playing, setPlaying] = useState(false);
  const [symbolIndex, setSymbolIndex] = useState(-1);

  const stop = useCallback(() => {
    playbackRef.current?.stop();
    playbackRef.current = null;
    setPlaying(false);
    setSymbolIndex(-1);
  }, []);

  useEffect(() => stop, [stop]);

  /** Play arbitrary text. `farnsworth` stretches inter-letter/word gaps. */
  const playText = useCallback(
    (
      text: string,
      opts?: { farnsworth?: boolean; onLetterEnd?: (ch: string) => void; onDone?: () => void },
    ) => {
      stop();
      let idx = -1;
      setPlaying(true);
      playbackRef.current = play(text, {
        characterWpm,
        effectiveWpm: opts?.farnsworth ? (effectiveWpm ?? characterWpm) : characterWpm,
        audio: true,
        audioMode: settings.audioMode,
        pitchHz: settings.pitchHz,
        waveform: settings.waveform,
        vintage: settings.vintage,
        onSymbolStart: () => {
          idx += 1;
          setSymbolIndex(idx);
        },
        onLetterEnd: (ch) => {
          idx = -1;
          setSymbolIndex(-1);
          opts?.onLetterEnd?.(ch);
        },
        onDone: () => {
          setPlaying(false);
          setSymbolIndex(-1);
          playbackRef.current = null;
          opts?.onDone?.();
        },
      });
    },
    [
      characterWpm,
      effectiveWpm,
      settings.audioMode,
      settings.pitchHz,
      settings.waveform,
      settings.vintage,
      stop,
    ],
  );

  const playChar = useCallback(
    (ch: string) => {
      const code = MORSE[ch.toUpperCase()];
      if (code) playText(ch);
    },
    [playText],
  );

  return { playText, playChar, stop, playing, symbolIndex };
}

/** Speak a word via the Web Speech API, if available. Fire-and-forget. */
export function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    synth.speak(u);
  } catch {
    /* ignore */
  }
}
