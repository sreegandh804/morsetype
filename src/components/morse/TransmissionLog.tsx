interface LetterEntry {
  symbols: string;
  correct: boolean;
}

interface Props {
  letters: LetterEntry[];
  current: string;
}

const MAX_LETTERS = 60;

export function TransmissionLog({ letters, current }: Props) {
  if (letters.length === 0 && current.length === 0) {
    return <div className="transmission-log transmission-log-empty" aria-hidden />;
  }

  const start = Math.max(0, letters.length - MAX_LETTERS);
  const visible = letters.slice(start);

  return (
    <div className="transmission-log" aria-hidden>
      {visible.map((letter, i) => (
        <span
          key={start + i}
          className="tlog-letter"
          data-correct={letter.correct ? "true" : "false"}
        >
          {letter.symbols.split("").map((s, j) => (
            <span
              key={j}
              className={`tape-mark ${s === "." ? "tape-dit" : "tape-dah"}`}
            />
          ))}
        </span>
      ))}
      {current.length > 0 && (
        <span className="tlog-letter tlog-current">
          {current.split("").map((s, j) => (
            <span
              key={j}
              className={`tape-mark ${s === "." ? "tape-dit" : "tape-dah"}`}
            />
          ))}
        </span>
      )}
    </div>
  );
}
