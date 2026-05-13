import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TypingTest } from "@/components/morse/TypingTest";
import { Onboarding } from "@/components/morse/Onboarding";
import { Header } from "@/components/morse/Header";
import { useTouchOnly } from "@/hooks/use-touch";
import { loadSettings } from "@/lib/morse/storage";

const ONBOARD_KEY = "morsetype.onboarded.v1";
const SETTINGS_KEY = "morsetype.settings.v1";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const isTouch = useTouchOnly();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    const hasOnboarded = !!localStorage.getItem(ONBOARD_KEY);
    const hasSettings = !!localStorage.getItem(SETTINGS_KEY);
    if (hasOnboarded || hasSettings) {
      setOnboarded(true);
      if (!hasOnboarded) localStorage.setItem(ONBOARD_KEY, "1");
    } else {
      setOnboarded(false);
    }
  }, []);

  function finishOnboarding() {
    localStorage.setItem(ONBOARD_KEY, "1");
    setOnboarded(true);
  }

  let content: React.ReactNode = null;
  if (isTouch) {
    content = <TouchGate />;
  } else if (onboarded === false) {
    const scheme = loadSettings().scheme;
    content = (
      <Onboarding
        scheme={scheme}
        onComplete={finishOnboarding}
        onSkip={finishOnboarding}
      />
    );
  } else if (onboarded === true) {
    content = <TypingTest />;
  }
  // onboarded === null: hold render until resolved to prevent flash

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-10 px-8">
        {content}
      </main>
      <footer className="px-8 py-4 text-center text-[11px] text-(--color-sub-faint) border-t border-(--color-hairline) lowercase tracking-wide">
        keyboard-first morse practice
      </footer>
    </div>
  );
}

function TouchGate() {
  return (
    <div className="max-w-md text-center flex flex-col items-center gap-5">
      <div className="text-(--color-main) text-2xl tracking-[2px]">
        −·− · −·− ·−·· ·− ··· ···
      </div>
      <h2 className="font-mono text-xl text-(--color-text)">keyboard required</h2>
      <p className="text-(--color-sub-strong) text-sm leading-relaxed">
        morsetype is keyboard-only — you need real keys to send dits and dahs.
        open this on a laptop or pair a bluetooth keyboard to this device.
      </p>
      <div className="text-[12px] text-(--color-sub-faint) flex gap-4 lowercase tracking-wide">
        <Link to="/about" className="hover:text-(--color-sub) underline underline-offset-4">alphabet chart</Link>
      </div>
    </div>
  );
}
