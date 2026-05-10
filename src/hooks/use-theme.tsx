import { useEffect } from "react";
import type { Theme } from "@/lib/morse/storage";

export function useApplyTheme(theme: Theme) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
}
