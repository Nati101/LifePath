"use client";

import ScaleGrid from "@/components/ScaleGrid";

interface StatementCardProps {
  statement: string;
  value: number | null;
  onChange: (value: number) => void;
}

export default function StatementCard({ statement, value, onChange }: StatementCardProps) {
  return (
    <div
      className={`
        surface-card px-5 py-6 sm:px-6 sm:py-7
        ${value != null ? "border-primary" : ""}
      `}
    >
      <p className="mb-6 text-center text-[15px] font-medium leading-relaxed tracking-tight text-foreground sm:text-base">
        {statement}
      </p>
      <ScaleGrid mode="select" value={value} onChange={onChange} />
    </div>
  );
}
