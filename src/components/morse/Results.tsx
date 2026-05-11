import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Settings } from "@/lib/morse/storage";
import { Stat } from "./StatsBar";

interface Props {
  wpm: number;
  acc: number;
  elapsedMs: number;
  correct: number;
  incorrect: number;
  settings: Settings;
  onRestart: () => void;
  direction?: "send" | "decode";
}

export function Results({ wpm, acc, elapsedMs, correct, incorrect, settings, onRestart, direction = "send" }: Props) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rank, setRank] = useState<number | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 20) {
      toast.error("Name must be 1–20 characters");
      return;
    }
    const myWpm = Math.round(wpm * 10) / 10;
    setSubmitting(true);
    const { error } = await supabase.from("leaderboard_entries").insert({
      name: trimmed,
      wpm: myWpm,
      accuracy: Math.round(acc * 10) / 10,
      mode: "test",
      content: settings.content,
      input_scheme: settings.scheme,
      duration_seconds: Math.round(elapsedMs / 1000),
      rank: settings.content === "ranks" ? settings.rank : null,
      direction,
    });
    if (error) { setSubmitting(false); toast.error(error.message); return; }

    const { count } = await supabase
      .from("leaderboard_entries")
      .select("id", { count: "exact", head: true })
      .gt("wpm", myWpm);
    setRank((count ?? 0) + 1);
    setSubmitting(false);
    setSubmitted(true);
    toast.success("Submitted to the leaderboard");
  }

  const accColor =
    acc >= 100 ? "var(--color-success)" :
    acc >= 90 ? "var(--color-main)" :
    "var(--color-error)";

  return (
    <div
      className="w-full flex flex-col items-center gap-6"
      style={{ viewTransitionName: "results-card" } as React.CSSProperties}
    >
      <div
        className="w-full px-8 py-7 rounded-xl text-center"
        style={{
          background: "var(--color-main-soft)",
          border: "1px solid var(--color-main-border)",
        }}
      >
        <div className="text-sm text-(--color-sub-strong) mb-4 tracking-wide lowercase">
          complete
        </div>
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-5">
          <Stat label="wpm" value={wpm} from={0} round />
          <Stat label="accuracy" value={acc} from={0} color={accColor} format={(n) => `${Math.round(n)}%`} />
          <Stat label="correct" value={correct} from={0} color="var(--color-sub-strong)" />
          <Stat
            label="errors"
            value={incorrect}
            from={0}
            color={incorrect > 0 ? "var(--color-error)" : "var(--color-sub)"}
          />
          <Stat label="time" value={elapsedMs / 1000} from={0} dim format={(n) => `${n.toFixed(1)}s`} />
        </div>
        <div className="text-[11px] text-(--color-sub-faint) lowercase tracking-wide">
          tab + enter → restart
        </div>
      </div>

      <div className="text-(--color-sub-faint) text-[11px] lowercase tracking-wide">
        {settings.content.replace("_", " ")} · {settings.scheme.replace("_", " ")}
      </div>

      {!submitted ? (
        <form onSubmit={submit} className="flex gap-2 items-center">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
            maxLength={20}
            className="w-48 bg-(--color-surface-1) border-(--color-border) text-(--color-text) font-mono"
          />
          <Button
            type="submit"
            disabled={submitting || !name.trim()}
            className="bg-(--color-main) text-(--primary-foreground) hover:bg-(--color-main)/90"
          >
            submit
          </Button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-1 text-sm">
          {rank != null ? (
            <p className="text-(--color-text)">
              you ranked{" "}
              <span className="text-(--color-main) font-bold">#{rank}</span>
            </p>
          ) : (
            <p className="text-(--color-text)">saved to the leaderboard</p>
          )}
          <Link
            to="/leaderboard"
            className="text-(--color-main) text-[12px] lowercase tracking-wide hover:underline underline-offset-4"
          >
            view leaderboard →
          </Link>
        </div>
      )}

      <Button
        variant="ghost"
        onClick={onRestart}
        className="text-(--color-sub) hover:text-(--color-text) text-xs lowercase tracking-wide"
      >
        next test (tab → enter)
      </Button>
    </div>
  );
}
