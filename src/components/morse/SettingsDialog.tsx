import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Settings, Theme } from "@/lib/morse/storage";
import { wpmFromUnit, unitFromWpm } from "@/lib/morse/storage";

const THEMES: Array<{
  key: Theme;
  title: string;
  blurb: string;
  swatch: { bg: string; fg: string; accent: string };
}> = [
  { key: "serika",     title: "serika",     blurb: "warm charcoal · mustard",       swatch: { bg: "#1a1814", fg: "#e8e0d0", accent: "#f0b429" } },
  { key: "telegraph",  title: "telegraph",  blurb: "cream paper · railroad red",     swatch: { bg: "#f4ecd6", fg: "#1a1612", accent: "#a4252b" } },
  { key: "midnight",   title: "midnight",   blurb: "navy · phosphor cyan",           swatch: { bg: "#0a1428", fg: "#ede8de", accent: "#6ee7ff" } },
  { key: "radiosport", title: "radiosport", blurb: "black · hi-vis orange",          swatch: { bg: "#000000", fg: "#ffffff", accent: "#ff5c1a" } },
];

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

export function SettingsDialog({ open, onOpenChange, settings, onChange }: Props) {
  const wpm = wpmFromUnit(settings.unitMs);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-(--color-main-border) text-(--color-text) max-w-md shadow-2xl"
        style={{ background: "var(--color-background)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-(--color-main) font-display">settings</DialogTitle>
          <DialogDescription className="text-(--color-sub)">configure how you key in Morse.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          <section>
            <Label className="text-(--color-sub) text-xs uppercase tracking-wider">theme</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {THEMES.map((t) => {
                const active = settings.theme === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => onChange({ theme: t.key })}
                    className={`flex items-center gap-3 rounded-md border p-2.5 text-left transition-colors ${active ? "border-(--color-main)" : "border-(--color-border) hover:border-(--color-sub)"}`}
                  >
                    <div
                      className="flex shrink-0 items-center gap-px overflow-hidden rounded-sm"
                      style={{ width: 36, height: 24 }}
                    >
                      <div style={{ background: t.swatch.bg, flex: 1, height: "100%" }} />
                      <div style={{ background: t.swatch.accent, width: 6, height: "100%" }} />
                      <div style={{ background: t.swatch.fg, width: 4, height: "100%" }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-(--color-text) text-[13px] leading-tight">{t.title}</div>
                      <div className="text-(--color-sub) text-[10px] leading-tight mt-0.5 truncate">{t.blurb}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <Label className="text-(--color-sub) text-xs uppercase tracking-wider">input scheme</Label>
            <RadioGroup value={settings.scheme} onValueChange={(v) => onChange({ scheme: v as Settings["scheme"] })} className="mt-2 gap-2">
              <SchemeOption value="paddle" title="single key (paddle)" hint="space — tap = dit, hold = dah" current={settings.scheme} />
              <SchemeOption value="two_key" title="two keys" hint="J = dit · K = dah" current={settings.scheme} />
              <SchemeOption value="literal" title="literal" hint=". = dit · - = dah" current={settings.scheme} />
            </RadioGroup>
          </section>

          <section>
            <Label className="text-(--color-sub) text-xs uppercase tracking-wider">letter / word breaks</Label>
            <RadioGroup value={settings.gapMode} onValueChange={(v) => onChange({ gapMode: v as Settings["gapMode"] })} className="mt-2 gap-2">
              <SchemeOption value="auto" title="auto-timing (ITU)" hint="3-unit pause = letter · 7-unit = word" current={settings.gapMode} />
              <SchemeOption value="explicit" title="explicit keys" hint="space = letter · enter = word (n/a in paddle)" current={settings.gapMode} />
            </RadioGroup>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-(--color-sub) text-xs uppercase tracking-wider">speed</Label>
              <span className="text-(--color-main) font-mono text-sm">{wpm} wpm · {settings.unitMs}ms unit</span>
            </div>
            <Slider min={10} max={40} step={1} value={[wpm]} onValueChange={([v]) => onChange({ unitMs: unitFromWpm(v) })} />
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-(--color-sub) text-xs uppercase tracking-wider">audio sidetone</Label>
              <Switch checked={settings.audio} onCheckedChange={(b) => onChange({ audio: b })} />
            </div>
            {settings.audio && (
              <div className="mt-3 space-y-4">
                <div>
                  <Label className="text-(--color-sub) text-[11px] uppercase tracking-wider">mode</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(["tone", "sounder"] as const).map((m) => {
                      const active = settings.audioMode === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => onChange({ audioMode: m })}
                          className={`rounded-md border p-2 text-left text-[12px] ${active ? "border-(--color-main) text-(--color-main)" : "border-(--color-border) text-(--color-sub-strong) hover:border-(--color-sub)"}`}
                        >
                          <div className="font-medium">{m === "tone" ? "tone" : "sounder"}</div>
                          <div className="text-(--color-sub-faint) text-[10px] leading-tight mt-0.5">
                            {m === "tone" ? "sine sidetone beep" : "mechanical click·clack"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {settings.audioMode === "tone" && (
                  <>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-(--color-sub) text-[11px] uppercase tracking-wider">pitch</Label>
                  <span className="text-(--color-main) font-mono text-xs">{settings.pitchHz} Hz</span>
                </div>
                <Slider
                  min={450}
                  max={900}
                  step={10}
                  value={[settings.pitchHz]}
                  onValueChange={([v]) => onChange({ pitchHz: v })}
                />
                <div>
                  <Label className="text-(--color-sub) text-[11px] uppercase tracking-wider">waveform</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(["sine", "square", "triangle"] as const).map((w) => {
                      const active = settings.waveform === w;
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => onChange({ waveform: w })}
                          className={`rounded-md border px-2 py-1.5 text-[12px] ${active ? "border-(--color-main) text-(--color-main)" : "border-(--color-border) text-(--color-sub-strong) hover:border-(--color-sub)"}`}
                        >
                          {w}
                        </button>
                      );
                    })}
                  </div>
                </div>
                  </>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-(--color-sub) text-[11px] uppercase tracking-wider block">vintage radio</Label>
                    <span className="text-(--color-sub-faint) text-[10px]">band-pass + room reverb</span>
                  </div>
                  <Switch checked={settings.vintage} onCheckedChange={(b) => onChange({ vintage: b })} />
                </div>
              </div>
            )}
          </section>

          <section className="flex items-center justify-between">
            <div>
              <Label className="text-(--color-sub) text-xs uppercase tracking-wider block">telegraph key</Label>
              <span className="text-(--color-sub-faint) text-[10px]">show key animation in corner</span>
            </div>
            <Switch checked={settings.showKey} onCheckedChange={(b) => onChange({ showKey: b })} />
          </section>

          <section className="flex items-center justify-between">
            <Label className="text-(--color-sub) text-xs uppercase tracking-wider">show morse hints</Label>
            <Switch checked={settings.showHints} onCheckedChange={(b) => onChange({ showHints: b })} />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SchemeOption({ value, title, hint, current }: { value: string; title: string; hint: string; current: string }) {
  const active = current === value;
  return (
    <label className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${active ? "border-(--color-main) bg-(--color-background)" : "border-(--color-border) hover:bg-(--color-background)"}`}>
      <RadioGroupItem value={value} className="mt-1 border-(--color-sub) text-(--color-main)" />
      <div>
        <div className="text-(--color-text) text-sm">{title}</div>
        <div className="text-(--color-sub) text-xs">{hint}</div>
      </div>
    </label>
  );
}
