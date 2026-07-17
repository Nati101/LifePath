"use client";

interface AttemptOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface ResultsAttemptPickerProps {
  attempts: AttemptOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function ResultsAttemptPicker({
  attempts,
  selectedId,
  onSelect,
}: ResultsAttemptPickerProps) {
  if (attempts.length <= 1) return null;

  return (
    <div className="rounded-[16px] border border-border bg-card p-4">
      <label htmlFor="attempt-picker" className="mb-2 block text-[13px] font-semibold text-muted">
        Previous results
      </label>
      <select
        id="attempt-picker"
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="input-field"
      >
        {attempts.map((attempt) => (
          <option key={attempt.id} value={attempt.id}>
            {attempt.label}
            {attempt.sublabel ? ` — ${attempt.sublabel}` : ""}
          </option>
        ))}
      </select>
      <p className="mt-2 text-[12px] text-muted">
        Choose an earlier attempt to compare with your latest results.
      </p>
    </div>
  );
}

export function formatAttemptDate(iso?: string | null) {
  if (!iso) return "Unknown date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
