import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Settings } from "@/lib/morse/storage";
import { wpmFromUnit, unitFromWpm } from "@/lib/morse/storage";

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
      <DialogContent className="bg-(--color-sub-alt) border-(--color-border) text-(--color-text) max-w-md">
        <DialogHeader>
          <DialogTitle className="text-(--color-main) font-mono">settings</DialogTitle>
          <DialogDescription className="text-(--color-sub)">configure how you key in Morse.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
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

          <section className="flex items-center justify-between">
            <Label className="text-(--color-sub) text-xs uppercase tracking-wider">audio sidetone</Label>
            <Switch checked={settings.audio} onCheckedChange={(b) => onChange({ audio: b })} />
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
