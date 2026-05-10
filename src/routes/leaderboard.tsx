import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/morse/Header";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — MorseType" },
      { name: "description", content: "Top Morse code typists ranked by WPM and accuracy." },
      { property: "og:title", content: "MorseType Leaderboard" },
      { property: "og:description", content: "Top Morse code typists ranked by WPM and accuracy." },
    ],
  }),
  component: Page,
});

interface Entry {
  id: string; name: string; wpm: number; accuracy: number;
  mode: string; content: string; input_scheme: string;
  duration_seconds: number; created_at: string;
}

const CONTENTS = ["all", "letters", "words", "sentences", "tongue_twisters", "numbers"] as const;
const MODES = ["all", "learn", "test"] as const;

function Page() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<(typeof CONTENTS)[number]>("all");
  const [mode, setMode] = useState<(typeof MODES)[number]>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      let q = supabase.from("leaderboard_entries").select("*").order("wpm", { ascending: false }).limit(50);
      if (content !== "all") q = q.eq("content", content);
      if (mode !== "all") q = q.eq("mode", mode);
      const { data } = await q;
      if (!cancelled) { setRows((data as Entry[]) ?? []); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [content, mode]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-8 py-10">
        <h1 className="font-mono text-2xl tracking-tight mb-1">
          <span className="text-(--color-text)">leader</span>
          <span className="text-(--color-main)">board</span>
        </h1>
        <p className="text-[13px] text-(--color-sub-faint) mb-8 lowercase">
          top 50 sessions, ranked by wpm
        </p>

        <div className="mode-cluster mb-8">
          {MODES.map(m => (
            <button key={m} className="pill" data-active={mode === m} onClick={() => setMode(m)}>{m}</button>
          ))}
          <span className="divider" />
          {CONTENTS.map(c => (
            <button key={c} className="pill" data-active={content === c} onClick={() => setContent(c)}>
              {c.replace("_", " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-(--color-sub-faint) text-sm lowercase">loading…</p>
        ) : rows.length === 0 ? (
          <div
            className="px-6 py-10 rounded-xl text-center"
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--hairline)",
            }}
          >
            <div className="text-2xl mb-3">·−</div>
            <div className="text-[13px] text-(--color-sub) lowercase">
              no entries yet — be the first.
            </div>
          </div>
        ) : (
          <div
            className="overflow-x-auto rounded-xl"
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--hairline)",
            }}
          >
            <table className="w-full font-mono text-sm">
              <thead className="text-(--color-sub-faint) text-[10px] uppercase tracking-[0.08em]">
                <tr>
                  <Th>#</Th><Th>name</Th><Th>wpm</Th><Th>acc</Th>
                  <Th>mode</Th><Th>content</Th><Th>input</Th><Th>when</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.id}
                    className="border-t border-(--color-hairline) hover:bg-white/[0.02] transition-colors"
                  >
                    <Td><span className="text-(--color-main)">{i + 1}</span></Td>
                    <Td className="text-(--color-text)">{r.name}</Td>
                    <Td><span className="text-(--color-main) font-bold">{r.wpm}</span></Td>
                    <Td className="text-(--color-sub-strong)">{r.accuracy}%</Td>
                    <Td className="text-(--color-sub)">{r.mode}</Td>
                    <Td className="text-(--color-sub)">{r.content.replace("_", " ")}</Td>
                    <Td className="text-(--color-sub)">{r.input_scheme.replace("_", " ")}</Td>
                    <Td className="text-(--color-sub-faint) text-xs">
                      {new Date(r.created_at).toLocaleDateString()}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-3 font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
