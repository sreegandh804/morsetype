import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Settings } from "@/lib/morse/storage";

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

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="flex flex-wrap items-end justify-center gap-12">
        <Stat label="wpm" value={Math.round(wpm).toString()} />
        <Stat label="acc" value={`${Math.round(acc)}%`} />
        <Stat label="time" value={`${(elapsedMs/1000).toFixed(1)}s`} />
        <Stat label="chars" value={`${correct}/${correct + incorrect}`} small />
      </div>

      <div className="text-(--color-sub) text-xs">
        {settings.mode} · {settings.content.replace("_", " ")} · {settings.scheme.replace("_"," ")}
      </div>

      {!submitted ? (
        <form onSubmit={submit} className="flex gap-2 items-center">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
            maxLength={20}
            className="w-48 bg-(--color-sub-alt) border-(--color-border) text-(--color-text) font-mono"
          />
          <Button type="submit" disabled={submitting || !name.trim()} className="bg-(--color-main) text-(--primary-foreground) hover:bg-(--color-main)/90">
            submit
          </Button>
        </form>
      ) : (
        <p className="text-(--color-success) text-sm">saved to the leaderboard</p>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onRestart} className="text-(--color-sub) hover:text-(--color-text)">
          next test (tab → enter)
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex flex-col items-start">
      <span className="text-(--color-sub) text-sm">{label}</span>
      <span className={`text-(--color-main) ${small ? "text-3xl" : "text-6xl"} font-bold leading-none`}>{value}</span>
    </div>
  );
}
