import { useEffect, useState } from "react";

export function useTouchOnly(): boolean | null {
  const [isTouch, setIsTouch] = useState<boolean | null>(null);
  useEffect(() => {
    const mql = window.matchMedia("(hover: none) and (pointer: coarse)");
    setIsTouch(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isTouch;
}
