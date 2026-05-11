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
          <h1 className="font-display text-3xl tracking-tight mb-2">
            <span className="text-(--color-text)">about </span>
            <span className="text-(--color-main)">morsetype</span>
          </h1>
          <p className="text-(--color-sub-strong) leading-relaxed max-w-2xl text-sm">
            A keyboard-first Morse code trainer. Pick how you want to key in dits and dahs,
            optionally turn on Morse hints under each letter, and start practicing.
            Correct letters dim into the background, mistakes pick up a red underline,
            and your WPM climbs as you go.
          </p>
        </section>

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
      <h2 className="font-display text-lg text-(--color-main) lowercase tracking-tight">
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
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-hairline)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-main-border)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-hairline)")}
        >
          <span className="text-(--color-text) text-xl font-semibold font-mono">{k.toUpperCase()}</span>
          <span className="text-(--color-main) text-[11px] tracking-[2px]">{MORSE[k]}</span>
        </div>
      ))}
    </div>
  );
}
