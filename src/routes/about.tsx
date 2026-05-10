import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/morse/Header";
import { MORSE } from "@/lib/morse/alphabet";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Learn — MorseType" },
      { name: "description", content: "How MorseType works, ITU timing rules, and the full International Morse Code alphabet chart." },
      { property: "og:title", content: "Learn — MorseType" },
      { property: "og:description", content: "Learn ITU Morse timing and explore the full alphabet chart." },
    ],
  }),
  component: Page,
});

function Page() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const numbers = "0123456789".split("");
  const punctuation = Object.keys(MORSE).filter(k => !/[A-Z0-9]/.test(k));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-8 py-10 space-y-12">
        <section>
          <h1 className="font-mono text-2xl tracking-tight mb-2">
            <span className="text-(--color-text)">about </span>
            <span className="text-(--color-main)">morsetype</span>
          </h1>
          <p className="text-(--color-sub-strong) leading-relaxed max-w-2xl text-sm">
            A keyboard-first Morse code trainer modeled on the UX of monkeytype. Pick a mode,
            pick how you want to key in dots and dashes, and start practicing. Letters turn
            green when you key them correctly and red when you don't. Watch your WPM climb.
          </p>
        </section>

        <Section title="two practice modes">
          <List items={[
            ["learn", "each letter is shown with its Morse code below. beginner-friendly."],
            ["test", "letters only. recall the Morse from memory."],
          ]} />
        </Section>

        <Section title="three input schemes">
          <List items={[
            ["single key (paddle)", "spacebar. tap = dit; holding longer = dah. hardest — tests timing."],
            ["two keys", "j = dit, k = dah. balanced."],
            ["literal", ". = dit, - = dah. easiest."],
          ]} />
        </Section>

        <Section title="itu timing">
          <p className="text-(--color-sub-strong) leading-relaxed max-w-2xl text-sm">
            International Morse uses one base unit (the dit). A dah is 3 units. The pause
            between symbols inside a letter is 1 unit, between letters is 3 units, and
            between words is <b className="text-(--color-text)">7 units</b>. In auto-timing
            mode, MorseType detects letter and word breaks from these pauses. In explicit
            mode, press <code className="text-(--color-main)">space</code> for a letter break and{" "}
            <code className="text-(--color-main)">enter</code> for a word break.
          </p>
        </Section>

        <Section title="alphabet">
          <ChartGrid keys={letters} />
        </Section>
        <Section title="numbers">
          <ChartGrid keys={numbers} />
        </Section>
        {punctuation.length > 0 && (
          <Section title="punctuation">
            <ChartGrid keys={punctuation} />
          </Section>
        )}

        <p className="text-(--color-sub-faint) text-[11px] lowercase tracking-wide">
          shortcuts: <code className="text-(--color-sub)">tab</code> +{" "}
          <code className="text-(--color-sub)">enter</code> restart ·{" "}
          <code className="text-(--color-sub)">esc</code> settings
        </p>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-mono text-base text-(--color-main) lowercase tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

function List({ items }: { items: [string, string][] }) {
  return (
    <ul className="space-y-2.5 text-sm">
      {items.map(([k, v]) => (
        <li key={k} className="flex gap-3">
          <span className="text-(--color-main) shrink-0">·−</span>
          <span className="text-(--color-sub-strong)">
            <b className="text-(--color-text) font-medium">{k}</b> — {v}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ChartGrid({ keys }: { keys: string[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
      {keys.map(k => (
        <div
          key={k}
          className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg transition-colors"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--hairline)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--main-border)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--hairline)")}
        >
          <span className="text-(--color-text) text-xl font-semibold font-mono">{k.toUpperCase()}</span>
          <span className="text-(--color-main) text-[11px] tracking-[2px]">{MORSE[k]}</span>
        </div>
      ))}
    </div>
  );
}
