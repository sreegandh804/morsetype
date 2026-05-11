import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  from?: number;
  duration?: number;
  format?: (n: number) => string | number;
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function TweenedNumber({ value, from, duration = 500, format }: Props) {
  const [displayed, setDisplayed] = useState(from ?? value);
  const fromRef = useRef(from ?? value);
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => {
    if (reduced.current) {
      setDisplayed(value);
      fromRef.current = value;
      return;
    }
    const start = performance.now();
    const startValue = fromRef.current;
    const delta = value - startValue;
    if (Math.abs(delta) < 0.01) {
      setDisplayed(value);
      fromRef.current = value;
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = startValue + delta * eased;
      setDisplayed(next);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format ? format(displayed) : Math.round(displayed)}</>;
}
