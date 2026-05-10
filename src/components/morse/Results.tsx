import { useState } from "react";
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
}

export function Results({ wpm, acc, elapsedMs, correct, incorrect, settings, onRestart }: Props) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 20) {
      toast.error("Name must be 1–20 characters");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("leaderboard_entries").insert({
      name: trimmed,
      wpm: Math.round(wpm * 10) / 10,
      accuracy: Math.round(acc * 10) / 10,
      mode: settings.mode,
      content: settings.content,
      input_scheme: settings.scheme,
      duration_seconds: Math.round(elapsedMs / 1000),
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setSubmitted(true);
    toast.success("Submitted to the leaderboard");
  }

  const accColor =
    acc >= 100 ? "var(--success)" :
    acc >= 90 ? "var(--main)" :
    "var(--error)";

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div
        className="w-full px-8 py-7 rounded-xl text-center"
        style={{
          background: "rgba(240, 180, 41, 0.04)",
          border: "1px solid rgba(240, 180, 41, 0.12)",
        }}
      >
        <div className="text-sm text-(--color-sub-strong) mb-4 tracking-wide lowercase">
          complete
        </div>
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-5">
          <Stat label="wpm" value={Math.round(wpm)} />
          <Stat label="accuracy" value={`${Math.round(acc)}%`} color={accColor} />
          <Stat label="correct" value={correct} color="rgba(255,255,255,0.5)" />
          <Stat
            label="errors"
            value={incorrect}
            color={incorrect > 0 ? "var(--error)" : "rgba(255,255,255,0.3)"}
          />
          <Stat label="time" value={`${(elapsedMs / 1000).toFixed(1)}s`} dim />
        </div>
        <div className="text-[11px] text-(--color-sub-faint) lowercase tracking-wide">
          tab + enter → restart
        </div>
      </div>

      <div className="text-(--color-sub-faint) text-[11px] lowercase tracking-wide">
        {settings.mode} · {settings.content.replace("_", " ")} · {settings.scheme.replace("_", " ")}
      </div>

      {!submitted ? (
        <form onSubmit={submit} className="flex gap-2 items-center">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
            maxLength={20}
            className="w-48 bg-white/[0.04] border-(--color-border) text-(--color-text) font-mono"
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
        <p className="text-(--success) text-sm">saved to the leaderboard</p>
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
