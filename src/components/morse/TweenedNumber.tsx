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
  const initial = from ?? value;
  const [displayed, setDisplayed] = useState(initial);
  const displayedRef = useRef(initial);
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => {
    if (reduced.current || duration <= 0) {
      setDisplayed(value);
      displayedRef.current = value;
      return;
    }
    const start = performance.now();
    const startValue = displayedRef.current;
    const delta = value - startValue;
    if (Math.abs(delta) < 0.01) {
      setDisplayed(value);
      displayedRef.current = value;
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = startValue + delta * eased;
      setDisplayed(next);
      displayedRef.current = next;
      if (t < 1) raf = requestAnimationFrame(tick);
      else displayedRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format ? format(displayed) : Math.round(displayed)}</>;
}
