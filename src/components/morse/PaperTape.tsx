interface Props {
  symbols: string;
  idle?: boolean;
}

const MAX_SYMBOLS = 80;

// "CQ DE MORSETYPE K" in Morse:
//   C=-.-.  Q=--.-  / D=-..  E=. / M=-- O=--- R=.-. S=... E=. T=- Y=-.-- P=.--. E=. / K=-.-
const IDLE_MORSE =
  "-.-. --.- / -.. . / -- --- .-. ... . - -.-- .--. . / -.-";
const IDLE_LOOP = `${IDLE_MORSE}   ${IDLE_MORSE}   `;

export function PaperTape({ symbols, idle = false }: Props) {
  if (idle) {
    return <IdleTape />;
  }

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

function IdleTape() {
  const content = (IDLE_LOOP + IDLE_LOOP).split("");
  return (
    <div className="paper-tape paper-tape-idle" aria-hidden>
      <div className="paper-tape-idle-inner">
        {content.map((s, i) => {
          if (s === ".") return <span key={i} className="tape-mark tape-dit tape-ambient" />;
          if (s === "-") return <span key={i} className="tape-mark tape-dah tape-ambient" />;
          if (s === "/") return <span key={i} className="tape-gap-word" />;
          return <span key={i} className="tape-gap-letter" />;
        })}
      </div>
    </div>
  );
}
