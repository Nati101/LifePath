import { config, getSectionCompletion, getSectionOrder } from "@/lib/scoring";
import type { Responses, SectionKey } from "@/lib/types";

interface SectionProgressProps {
  responses: Responses;
}

export default function SectionProgress({ responses }: SectionProgressProps) {
  const completion = getSectionCompletion(responses);
  const sections = getSectionOrder();

  return (
    <div className="admin-section-progress">
      {sections.map((section: SectionKey) => {
        const percent = Math.round((completion[section] ?? 0) * 100);
        const complete = percent >= 100;

        return (
          <div key={section} className="admin-section-progress__item">
            <div className="admin-section-progress__header">
              <span className="admin-section-progress__label">{config.sections[section].label}</span>
              <span className="admin-section-progress__value">
                {complete ? "Complete" : `${percent}%`}
              </span>
            </div>
            <div className="admin-progress__track">
              <div
                className={`admin-progress__fill${complete ? " admin-progress__fill--complete" : ""}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
