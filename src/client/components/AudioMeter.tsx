/**
 * AudioMeter — Real-time audio level visualization.
 */

interface Props {
  level: number; // 0-1
  isRecording: boolean;
}

export default function AudioMeter({ level, isRecording }: Props) {
  const bars = 20;
  const activeBars = Math.round(level * bars);

  return (
    <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 32 }}>
      {Array.from({ length: bars }, (_, i) => {
        const isActive = isRecording && i < activeBars;
        const height = 8 + (i / bars) * 24;
        const color = i < bars * 0.6
          ? "var(--color-success)"
          : i < bars * 0.85
            ? "var(--color-warning)"
            : "var(--color-danger)";

        return (
          <div
            key={i}
            style={{
              width: 4,
              height,
              borderRadius: 2,
              background: isActive ? color : "var(--color-border)",
              transition: "background 0.05s ease",
            }}
          />
        );
      })}
    </div>
  );
}
