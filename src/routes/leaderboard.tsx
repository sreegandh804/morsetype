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

const CONTENTS = ["all","letters","words","sentences","tongue_twisters","numbers"] as const;
const MODES = ["all","learn","test"] as const;

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
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <h1 className="font-mono text-3xl">
          <span className="text-(--color-text)">leader</span>
          <span className="text-(--color-main)">board</span>
        </h1>

        <div className="flex flex-wrap gap-2 my-6 bg-(--color-sub-alt) rounded-lg p-2">
          <span className="text-(--color-sub) text-xs self-center px-2">mode</span>
          {MODES.map(m => (
            <button key={m} className="pill" data-active={mode===m} onClick={() => setMode(m)}>{m}</button>
          ))}
          <span className="mx-2 h-5 w-px bg-(--color-border) self-center" />
          <span className="text-(--color-sub) text-xs self-center px-2">content</span>
          {CONTENTS.map(c => (
            <button key={c} className="pill" data-active={content===c} onClick={() => setContent(c)}>{c.replace("_"," ")}</button>
          ))}
        </div>

        {loading ? (
          <p className="text-(--color-sub) text-sm">loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-(--color-sub) text-sm">no entries yet — be the first.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-(--color-border)">
            <table className="w-full font-mono text-sm">
              <thead className="bg-(--color-sub-alt) text-(--color-sub) text-xs uppercase tracking-wider">
                <tr>
                  <Th>#</Th><Th>name</Th><Th>wpm</Th><Th>acc</Th>
                  <Th>mode</Th><Th>content</Th><Th>input</Th><Th>when</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className="border-t border-(--color-border) hover:bg-(--color-sub-alt)/50">
                    <Td><span className="text-(--color-main)">{i+1}</span></Td>
                    <Td className="text-(--color-text)">{r.name}</Td>
                    <Td><span className="text-(--color-main) font-bold">{r.wpm}</span></Td>
                    <Td>{r.accuracy}%</Td>
                    <Td className="text-(--color-sub)">{r.mode}</Td>
                    <Td className="text-(--color-sub)">{r.content.replace("_"," ")}</Td>
                    <Td className="text-(--color-sub)">{r.input_scheme.replace("_"," ")}</Td>
                    <Td className="text-(--color-sub) text-xs">{new Date(r.created_at).toLocaleDateString()}</Td>
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
  return <th className="text-left px-3 py-2 font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
