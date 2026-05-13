interface Props {
  /** Symbols of the currently-playing letter, built up symbol-by-symbol. */
  symbols: string;
  /** True once the letter has finished sounding; resets when the next symbol arrives. */
  complete: boolean;
}

/**
 * Live readout of the Morse pattern for the letter currently being broadcast.
 * Pellets land one at a time using the same animation as send-mode's
 * InputVisualizer, then dim through the inter-letter gap.
 *
 * History across letters lives in TransmissionLog at the bottom of the page.
 */
export function MorseStream({ symbols, complete }: Props) {
  if (symbols.length === 0) {
    return <div className="receive-hint" aria-hidden />;
  }
  return (
    <div className={`receive-hint ${complete ? "is-complete" : ""}`} aria-hidden>
      {symbols.split("").map((s, i) => (
        <span
          key={i}
          className={`receive-pellet pellet-in ${s === "." ? "rp-dit" : "rp-dah"}`}
        />
      ))}
    </div>
  );
}
