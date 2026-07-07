"use client";

interface ProgressBarProps {
  percent: number;
  step: number;
  totalSteps: number;
}

export default function ProgressBar({ percent, step, totalSteps }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-[12px] font-medium text-muted">
        <span className="tabular-nums">{percent}%</span>
        <span className="tabular-nums">
          Step {step} of {totalSteps}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-border/80">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${Math.max(percent, 1)}%` }}
        />
      </div>
    </div>
  );
}
