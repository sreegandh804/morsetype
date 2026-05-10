import type { Settings } from "@/lib/morse/storage";
import type { ContentKind } from "@/lib/morse/content";
import { GraduationCap, Target, Volume2, VolumeX, Settings as SettingsIcon } from "lucide-react";

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onOpenSettings: () => void;
}

const CONTENTS: { key: ContentKind; label: string }[] = [
  { key: "letters", label: "letters" },
  { key: "words", label: "words" },
  { key: "sentences", label: "sentences" },
  { key: "tongue_twisters", label: "tongue twisters" },
  { key: "numbers", label: "numbers" },
];

const LENGTHS = [10, 25, 50, 100];

export function ModeBar({ settings, onChange, onOpenSettings }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1 rounded-lg bg-(--color-sub-alt) px-3 py-2 text-sm">
      <button className="pill" data-active={settings.mode === "learn"} onClick={() => onChange({ mode: "learn", showHints: true })}>
        <GraduationCap className="size-4" /> learn
      </button>
      <button className="pill" data-active={settings.mode === "test"} onClick={() => onChange({ mode: "test", showHints: false })}>
        <Target className="size-4" /> test
      </button>
      <span className="mx-2 h-5 w-px bg-(--color-border)" />
      {CONTENTS.map(c => (
        <button key={c.key} className="pill" data-active={settings.content === c.key} onClick={() => onChange({ content: c.key })}>
          {c.label}
        </button>
      ))}
      <span className="mx-2 h-5 w-px bg-(--color-border)" />
      {LENGTHS.map(n => (
        <button key={n} className="pill" data-active={settings.wordCount === n} onClick={() => onChange({ wordCount: n })}>
          {n}
        </button>
      ))}
      <span className="mx-2 h-5 w-px bg-(--color-border)" />
      <button className="pill" data-active={settings.audio} onClick={() => onChange({ audio: !settings.audio })} title="Toggle audio">
        {settings.audio ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
      </button>
      <button className="pill" onClick={onOpenSettings} title="Settings">
        <SettingsIcon className="size-4" />
      </button>
    </div>
  );
}
