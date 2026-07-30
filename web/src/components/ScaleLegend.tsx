"use client";

import ScaleGrid from "@/components/ScaleGrid";

interface ScaleLegendProps {
  description?: string;
}

export default function ScaleLegend({ description }: ScaleLegendProps) {
  return (
    <div className="mb-7 rounded-[16px] bg-card/70 px-3 py-4 shadow-[var(--shadow-sm)] sm:px-4">
      <ScaleGrid mode="legend" />
      {description ? (
        <p className="mt-3 px-1 text-center text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
