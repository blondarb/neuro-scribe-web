/**
 * StatusBadge — Visual encounter status indicator.
 */

const LABELS: Record<string, string> = {
  recording: "Recording",
  transcribed: "Transcribed",
  generating: "Generating",
  drafted: "Draft",
  reviewed: "Reviewed",
  finalized: "Final",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
