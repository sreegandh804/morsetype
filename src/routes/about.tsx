import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/morse/Header";
import { MORSE } from "@/lib/morse/alphabet";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About & Morse Reference — MorseType" },
      { name: "description", content: "How MorseType works, ITU timing rules, and the full International Morse Code alphabet chart." },
      { property: "og:title", content: "About MorseType" },
      { property: "og:description", content: "Learn ITU Morse timing and explore the full alphabet chart." },
    ],
  }),
  component: Page,
});

function Page() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const numbers = "0123456789".split("");
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-12">
        <section className="space-y-3">
          <h1 className="font-mono text-3xl">
            <span className="text-(--color-text)">about </span>
            <span className="text-(--color-main)">morsetype</span>
          </h1>
          <p className="text-(--color-sub) leading-relaxed max-w-2xl">
            A keyboard-first Morse code trainer modeled on the UX of monkeytype. Pick a mode,
            pick how you want to key in dots and dashes, and start practicing. Letters turn
            green when you key them correctly and red when you don't. Watch your WPM climb.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-mono text-xl text-(--color-main)">two practice modes</h2>
          <ul className="text-(--color-sub) space-y-2 list-disc pl-5">
            <li><b className="text-(--color-text)">learn</b> — each letter is shown with its Morse code below. Beginner-friendly.</li>
            <li><b className="text-(--color-text)">test</b> — letters only. Recall the Morse from memory.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-mono text-xl text-(--color-main)">three input schemes</h2>
          <ul className="text-(--color-sub) space-y-2 list-disc pl-5">
            <li><b className="text-(--color-text)">single key (paddle)</b> — Spacebar. A short tap is a dit; holding longer than 2 units is a dah. Hardest — tests your timing.</li>
            <li><b className="text-(--color-text)">two keys</b> — <code>J</code> = dit, <code>K</code> = dah. Balanced.</li>
            <li><b className="text-(--color-text)">literal</b> — <code>.</code> = dit, <code>-</code> = dah. Easiest.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-mono text-xl text-(--color-main)">itu timing</h2>
          <p className="text-(--color-sub) leading-relaxed max-w-2xl">
            International Morse uses one base unit (the dit). A dah is 3 units. The pause
            between symbols inside a letter is 1 unit, between letters is 3 units, and
            between words is <b className="text-(--color-text)">7 units</b>. In auto-timing
            mode, MorseType detects letter and word breaks from these pauses. In explicit
            mode, press <code>Space</code> for a letter break and <code>Enter</code> for a
            word break.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-mono text-xl text-(--color-main)">alphabet</h2>
          <ChartGrid keys={letters} />
        </section>
        <section className="space-y-3">
          <h2 className="font-mono text-xl text-(--color-main)">numbers</h2>
          <ChartGrid keys={numbers} />
        </section>
        <section className="space-y-3">
          <h2 className="font-mono text-xl text-(--color-main)">punctuation</h2>
          <ChartGrid keys={Object.keys(MORSE).filter(k => !/[A-Z0-9]/.test(k))} />
        </section>

        <p className="text-(--color-sub) text-xs">
          shortcuts: <code>tab</code> + <code>enter</code> restart · <code>esc</code> settings
        </p>
      </main>
    </div>
  );
}

function ChartGrid({ keys }: { keys: string[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
      {keys.map(k => (
        <div key={k} className="bg-(--color-sub-alt) rounded-md px-3 py-2 flex items-baseline gap-3 font-mono">
          <span className="text-(--color-text) text-lg w-6">{k}</span>
          <span className="text-(--color-main) tracking-widest">{MORSE[k]}</span>
        </div>
      ))}
    </div>
  );
}
