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
      <main className="flex-1 flex items-center justify-center py-8">
        <TypingTest />
      </main>
      <footer className="text-center text-(--color-sub) text-xs py-6">
        keyboard-first morse practice · inspired by monkeytype
      </footer>
    </div>
  );
}
