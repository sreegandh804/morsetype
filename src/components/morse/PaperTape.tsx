interface Props {
  symbols: string;
}

const MAX_SYMBOLS = 80;

export function PaperTape({ symbols }: Props) {
  const start = Math.max(0, symbols.length - MAX_SYMBOLS);
  const recent = symbols.slice(start);

  return (
    <div className="paper-tape" aria-hidden>
      <div className="paper-tape-inner">
        {recent.split("").map((s, i) => {
          const key = `${start + i}`;
          if (s === ".") return <span key={key} className="tape-mark tape-dit" />;
          if (s === "-") return <span key={key} className="tape-mark tape-dah" />;
          if (s === "/") return <span key={key} className="tape-gap-word" />;
          return <span key={key} className="tape-gap-letter" />;
        })}
      </div>
    </div>
  );
}
