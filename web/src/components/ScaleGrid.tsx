"use client";

import { scaleOptions } from "@/lib/scale";

interface ScaleGridProps {
  mode: "legend" | "select";
  value?: number | null;
  onChange?: (value: number) => void;
}

export default function ScaleGrid({ mode, value = null, onChange }: ScaleGridProps) {
  return (
    <div
      className="mx-auto grid w-full max-w-[420px] grid-cols-4 gap-1"
      role={mode === "select" ? "radiogroup" : undefined}
    >
      {scaleOptions.map((opt) => {
        const selected = value === opt.value;

        if (mode === "legend") {
          return (
            <div key={opt.value} className="flex flex-col items-center gap-2 px-0.5">
              <div
                className="h-9 w-9 rounded-full border-[1.5px] sm:h-10 sm:w-10"
                style={{ backgroundColor: opt.fill, borderColor: opt.border }}
              />
              <span className="text-center text-[10px] leading-tight text-muted sm:text-[11px]">
                <span className="sm:hidden">{opt.shortLabel}</span>
                <span className="hidden sm:inline">{opt.label}</span>
              </span>
            </div>
          );
        }

        return (
          <div key={opt.value} className="flex justify-center px-0.5">
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={opt.label}
              onClick={() => onChange?.(opt.value)}
              className="cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
            >
              <span
                className={`
                  flex h-11 w-11 items-center justify-center rounded-full border-[1.5px]
                  transition-all duration-200 ease-out
                  ${selected ? "scale-105" : "hover:scale-[1.04] active:scale-95"}
                `}
                style={{
                  backgroundColor: selected ? opt.fill : "#ffffff",
                  borderColor: selected ? opt.ring : opt.border,
                  boxShadow: selected
                    ? `0 0 0 3px ${opt.fill}`
                    : "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                {selected && (
                  <svg
                    className="h-[18px] w-[18px] animate-check-pop"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M5 10.5l3 3 7-7"
                      stroke={opt.ring}
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
