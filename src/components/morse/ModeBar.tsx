import type { Settings } from "@/lib/morse/storage";
import type { ContentKind } from "@/lib/morse/content";
import { RANKS } from "@/lib/morse/ranks";
import { Volume2, VolumeX, Settings as SettingsIcon } from "lucide-react";

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onOpenSettings: () => void;
}

const CONTENTS: { key: ContentKind; label: string }[] = [
  { key: "letters", label: "letters" },
  { key: "words", label: "words" },
  { key: "sentences", label: "sentences" },
  { key: "ranks", label: "ranks" },
  { key: "numbers", label: "numbers" },
];

const LENGTHS = [10, 25, 50, 100];

export function ModeBar({ settings, onChange, onOpenSettings }: Props) {
  return (
    <div className="mode-cluster">
      {CONTENTS.map(c => (
        <button key={c.key} className="pill" data-active={settings.content === c.key} onClick={() => onChange({ content: c.key })}>
          {c.label}
        </button>
      ))}
      <span className="divider" />
      {settings.content === "ranks" ? (
        <>
          {RANKS.map((r) => (
            <button
              key={r.key}
              className="pill"
              data-active={settings.rank === r.key}
              onClick={() =>
                onChange({
                  rank: r.key,
                  unitMs: Math.min(settings.unitMs, r.unitMsFloor),
                })
              }
              title={r.blurb}
            >
              {r.label}
            </button>
          ))}
          <span className="divider" />
        </>
      ) : null}
      {LENGTHS.map(n => (
        <button key={n} className="pill" data-active={settings.wordCount === n} onClick={() => onChange({ wordCount: n })}>
          {n}
        </button>
      ))}
      <span className="divider" />
      <button
        className="pill"
        data-active={settings.showHints}
        onClick={() => onChange({ showHints: !settings.showHints })}
        title="Toggle morse hints"
      >
        hints
      </button>
      <span className="divider" />
      <button className="pill" data-active={settings.audio} onClick={() => onChange({ audio: !settings.audio })} title="Toggle audio">
        {settings.audio ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
      </button>
      <button className="pill" onClick={onOpenSettings} title="Settings">
        <SettingsIcon className="size-3.5" />
      </button>
    </div>
  );
}
