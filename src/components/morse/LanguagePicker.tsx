import { useState } from "react";
import { Globe, Check, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LANGUAGES, getLanguage } from "@/lib/morse/languages";

interface Props {
  value: string;
  onChange: (id: string) => void;
}

export function LanguagePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const active = getLanguage(value);
  const filtered = LANGUAGES.filter((l) => l.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 text-(--color-sub) hover:text-(--color-main) transition-colors text-sm font-mono"
          title="Choose language"
        >
          <Globe className="size-4" />
          <span>{active.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        className="bg-(--color-sub-alt) border-(--color-border) text-(--color-text) p-0 w-72 max-h-96 overflow-hidden"
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-(--color-border)">
          <Search className="size-3.5 text-(--color-sub)" />
          <input
            autoFocus
            placeholder="Language..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent outline-none text-sm font-mono w-full placeholder:text-(--color-sub-faint)"
          />
        </div>
        <div className="overflow-y-auto max-h-80 py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-xs text-(--color-sub-faint)">no matches</div>
          ) : (
            filtered.map((l) => {
              const selected = l.id === value;
              return (
                <button
                  key={l.id}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm font-mono hover:bg-(--color-background) text-(--color-sub-strong) hover:text-(--color-main) transition-colors"
                  onClick={() => {
                    onChange(l.id);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <span className="w-3.5 inline-flex">
                    {selected && <Check className="size-3.5 text-(--color-main)" />}
                  </span>
                  <span>{l.label}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
