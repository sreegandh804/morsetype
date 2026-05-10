interface Props {
  currentInput: string;
  targetMorse: string | null;
  hint: string;
}

export function InputVisualizer({ currentInput, targetMorse, hint }: Props) {
  if (!targetMorse) {
    return <div className="h-12" aria-hidden />;
  }

  const isCorrectSoFar = targetMorse.startsWith(currentInput);
  const borderColor = isCorrectSoFar
    ? "var(--main-border)"
    : "rgba(224, 82, 82, 0.3)";
  const pelletColor = isCorrectSoFar ? "var(--main)" : "var(--error)";

  return (
    <div className="flex items-center justify-center gap-3 h-12 mb-2">
      <div
        className="flex items-center gap-1 px-4 py-2 rounded-lg min-w-[80px] min-h-9 justify-center"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: `1px solid ${borderColor}`,
        }}
      >
        {currentInput.length === 0 ? (
          <span className="font-mono text-xs text-(--color-sub-faint)">{hint}</span>
        ) : (
          currentInput.split("").map((c, i) => (
            <span
              key={i}
              className="inline-block rounded-sm"
              style={{
                width: c === "." ? 6 : 18,
                height: 6,
                background: pelletColor,
              }}
            />
          ))
        )}
      </div>
      <div className="font-mono text-[11px] text-(--color-sub-faint) tracking-[1px]">
        {targetMorse}
      </div>
    </div>
  );
}
