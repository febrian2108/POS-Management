import { CircleHelp } from "lucide-react";

export function FieldTooltip({ text }: { text: string }) {
  return (
    <span
      className="inline-flex cursor-help items-center text-[var(--muted)]"
      title={text}
      aria-label={text}
      role="note"
    >
      <CircleHelp size={14} />
    </span>
  );
}
