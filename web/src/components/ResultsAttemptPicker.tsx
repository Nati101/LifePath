"use client";

import { useId } from "react";

interface AttemptOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface ResultsAttemptPickerProps {
  attempts: AttemptOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Defaults to student-facing “your” copy; use admin on advisor views. */
  audience?: "self" | "admin";
  label?: string;
}

export default function ResultsAttemptPicker({
  attempts,
  selectedId,
  onSelect,
  audience = "self",
  label = "Previous results",
}: ResultsAttemptPickerProps) {
  const pickerId = useId();

  if (attempts.length <= 1) return null;

  const helper =
    audience === "admin"
      ? "Choose an earlier attempt to compare with the latest results."
      : "Choose an earlier attempt to compare with your latest results.";

  return (
    <div className="rounded-[16px] border border-border bg-card p-4">
      <label htmlFor={pickerId} className="mb-2 block text-[13px] font-semibold text-muted">
        {label}
      </label>
      <select
        id={pickerId}
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
      <p className="mt-2 text-[12px] text-muted">{helper}</p>
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
