import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/morse/Header";
import { KeyTutorial } from "@/components/morse/KeyTutorial";
import { useTouchOnly } from "@/hooks/use-touch";

export const Route = createFileRoute("/learn-key")({
  head: () => ({
    meta: [
      { title: "Learn the Key — MorseType" },
      {
        name: "description",
        content:
          "Train the rhythm of a real telegraph straight key — tap for dits, hold for dahs. A 4-step micro-tutorial.",
      },
      { property: "og:title", content: "MorseType — Learn the Key" },
      {
        property: "og:description",
        content: "A 4-step micro-tutorial to feel the rhythm of a real telegraph key.",
      },
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
            keyboard required to feel the key — open this on a laptop.
          </p>
        ) : (
          <KeyTutorial />
        )}
      </main>
      <footer className="px-8 py-4 text-center text-[11px] text-(--color-sub-faint) border-t border-(--color-hairline) lowercase tracking-wide">
        rhythm training · one key, one rhythm
      </footer>
    </div>
  );
}
