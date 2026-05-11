import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/morse/Header";
import { DecodeTest } from "@/components/morse/DecodeTest";
import { useTouchOnly } from "@/hooks/use-touch";

export const Route = createFileRoute("/receive")({
  head: () => ({
    meta: [
      { title: "Receive — MorseType" },
      { name: "description", content: "Train your ear: type the plaintext as Morse code is sent to you." },
      { property: "og:title", content: "MorseType — Receive" },
      { property: "og:description", content: "Train your ear by decoding live Morse audio." },
    ],
  }),
  component: Page,
});

function Page() {
  const isTouch = useTouchOnly();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-10 px-8">
        {isTouch ? (
          <p className="text-(--color-sub-strong) text-sm max-w-md text-center lowercase">
            keyboard required to decode — open this on a laptop.
          </p>
        ) : (
          <DecodeTest />
        )}
      </main>
      <footer className="px-8 py-4 text-center text-[11px] text-(--color-sub-faint) border-t border-(--color-hairline) lowercase tracking-wide">
        ear training · type what you hear
      </footer>
    </div>
  );
}