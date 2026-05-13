import { flushSync } from "react-dom";

type DocWithVT = Document & { startViewTransition?: (cb: () => void) => unknown };

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Run a state update inside a same-document View Transition. React state changes
 * are flushed synchronously so the browser captures the new DOM correctly.
 * No-ops gracefully when the API is missing or reduced motion is requested.
 */
export function withViewTransition(update: () => void) {
  const doc = (typeof document !== "undefined" ? document : undefined) as DocWithVT | undefined;
  if (!doc || typeof doc.startViewTransition !== "function" || prefersReducedMotion()) {
    update();
    return;
  }
  doc.startViewTransition(() => flushSync(update));
}

/** Sanitize an arbitrary character into a CSS-ident-safe view-transition-name suffix. */
export function vtNameFor(prefix: string, ch: string): string {
  return /^[A-Za-z0-9]$/.test(ch) ? `${prefix}-${ch}` : `${prefix}-u${ch.codePointAt(0)}`;
}
