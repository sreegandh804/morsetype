import { createFileRoute, Link } from "@tanstack/react-router";
import { TypingTest } from "@/components/morse/TypingTest";
import { Header } from "@/components/morse/Header";
import { useTouchOnly } from "@/hooks/use-touch";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const isTouch = useTouchOnly();
  const content = isTouch ? <TouchGate /> : <TypingTest />;

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
