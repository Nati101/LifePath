import {
  getPart2Config,
  getPart2SectionOrder,
} from "@/lib/part2-scoring";
import type { Part2Responses, Part2SectionKey } from "@/lib/part2-types";

interface Part2SectionProgressProps {
  responses: Part2Responses;
}

export default function Part2SectionProgress({ responses }: Part2SectionProgressProps) {
  const config = getPart2Config();
  const sections = getPart2SectionOrder();

  return (
    <div className="admin-section-progress">
      {sections.map((section: Part2SectionKey) => {
        const items = config.sections[section].items;
        const answered = items.filter((item) => responses[item.id] != null).length;
        const percent = items.length > 0 ? Math.round((answered / items.length) * 100) : 0;
        const complete = percent >= 100;

        return (
          <div key={section} className="admin-section-progress__item">
            <div className="admin-section-progress__header">
              <span className="admin-section-progress__label">
                {config.sections[section].label}
              </span>
              <span className="admin-section-progress__value">
                {complete ? "Complete" : `${percent}%`}
              </span>
            </div>
            <div
              className="admin-progress__track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label={`${config.sections[section].label} ${complete ? "complete" : `${percent}%`}`}
            >
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
