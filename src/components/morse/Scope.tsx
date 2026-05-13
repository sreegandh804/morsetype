import { useEffect, useRef } from "react";
import { getAudioAnalyser } from "@/lib/morse/audio";

interface Props {
  /** When true, the scope is actively drawing. When false, baseline drift only. */
  active: boolean;
}

/**
 * Real-time oscilloscope of the shared audio bus. Tapped via AnalyserNode.
 * Draws the time-domain waveform in --color-main. Falls back to a flat
 * baseline under prefers-reduced-motion.
 */
export function Scope({ active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const dataRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const activeRef = useRef(active);

  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function sizeCanvas() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.scale(dpr, dpr);
    }
    sizeCanvas();
    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(canvas);

    const analyser = getAudioAnalyser();
    if (analyser && !dataRef.current) {
      dataRef.current = new Float32Array(new ArrayBuffer(analyser.fftSize * 4));
    }

    function lineColor() {
      const root = getComputedStyle(document.documentElement);
      return root.getPropertyValue("--color-main").trim() || "#f0b429";
    }
    function subColor() {
      const root = getComputedStyle(document.documentElement);
      return root.getPropertyValue("--color-sub-faint").trim() || "#888";
    }

    let t0 = performance.now();
    function draw() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const mid = h / 2;
      const isActive = activeRef.current;

      if (reduceMotion || !analyser) {
        // Static baseline. No animation, still on-brand.
        ctx.strokeStyle = isActive ? lineColor() : subColor();
        ctx.globalAlpha = isActive ? 0.85 : 0.4;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(8, mid);
        ctx.lineTo(w - 8, mid);
        ctx.stroke();
        return;
      }

      const data = dataRef.current!;
      analyser.getFloatTimeDomainData(data);

      // Detect signal envelope to decide between live waveform and idle drift.
      let peak = 0;
      for (let i = 0; i < data.length; i++) {
        const v = Math.abs(data[i]);
        if (v > peak) peak = v;
      }
      const hasSignal = peak > 0.002;

      ctx.lineWidth = 1.6;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      if (hasSignal) {
        ctx.strokeStyle = lineColor();
        ctx.globalAlpha = 0.95;
        ctx.shadowColor = lineColor();
        ctx.shadowBlur = 6;
        // Normalize so quiet signal still fills the strip nicely.
        const norm = Math.min(0.45, peak) / 0.45;
        const yScale = (h * 0.42) * (0.4 + 0.6 * norm);
        ctx.beginPath();
        const N = data.length;
        const px = (w - 16) / (N - 1);
        for (let i = 0; i < N; i++) {
          const x = 8 + i * px;
          const y = mid - data[i] * yScale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Idle: a sleepy, low-amplitude sine drift so the strip feels alive
        // without competing with the actual signal when it arrives.
        ctx.strokeStyle = isActive ? lineColor() : subColor();
        ctx.globalAlpha = isActive ? 0.35 : 0.25;
        const t = (performance.now() - t0) / 1000;
        const amp = isActive ? 1.2 : 0.6;
        ctx.beginPath();
        const steps = 96;
        for (let i = 0; i <= steps; i++) {
          const x = 8 + (i / steps) * (w - 16);
          const phase = (i / steps) * Math.PI * 4 + t * 1.2;
          const y = mid + Math.sin(phase) * amp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="scope-strip" aria-hidden>
      <canvas ref={canvasRef} className="scope-canvas" />
    </div>
  );
}
