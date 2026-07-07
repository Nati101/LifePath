"use client";

import ScaleGrid from "@/components/ScaleGrid";

export default function ScaleLegend() {
  return (
    <div className="mb-7 rounded-[16px] bg-card/70 px-3 py-4 shadow-[var(--shadow-sm)] sm:px-4">
      <ScaleGrid mode="legend" />
    </div>
  );
}
