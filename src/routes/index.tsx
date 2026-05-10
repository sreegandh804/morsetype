import { createFileRoute } from "@tanstack/react-router";
import { TypingTest } from "@/components/morse/TypingTest";
import { Header } from "@/components/morse/Header";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-10 px-8">
        <TypingTest />
      </main>
      <footer className="px-8 py-4 text-center text-[11px] text-(--color-sub-faint) border-t border-(--color-hairline) lowercase tracking-wide">
        keyboard-first morse practice · inspired by monkeytype
      </footer>
    </div>
  );
}
