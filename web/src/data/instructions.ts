import type { SectionKey } from "@/lib/types";

export const startHereInstructions = {
  title: "LifePath Career Exploration Assessment",
  tagline:
    "A strengths-based tool for exploration (not prediction). Designed for students ages 14–18, educators, and families.",
  steps: [
    "Go to each section: Interests → Strengths → Drivers → Work Style & Environment.",
    "In each section, answer every question using the 1–4 scale.",
    "Try to answer all items. If you truly can't answer one, leave it blank and come back later.",
    "When each section shows 100% completion, open your Results.",
    "Use the results to pick 2–3 paths to explore first (classes, clubs, job shadows, interviews).",
  ],
  scaleNote:
    "1 = Not me / Not true right now · 2 = A little like me · 3 = Mostly me · 4 = Very me",
  importantNotes: [
    "This tool is for career exploration and conversation. It does not \"decide\" your future and it is not a diagnosis.",
    "Your scores can change as you learn more about yourself and try new activities.",
    "Use the results to expand choices: combine your top paths with electives, extracurriculars, or part-time work ideas.",
    "If anything feels unfair or doesn't fit your culture, values, or abilities, talk with an educator—your context matters.",
  ],
  scoringNote:
    "How scores are combined: Interests 35% + Strengths 35% + Drivers 20% + Work Style & Environment 10%.",
};

export const sectionInstructions: Record<
  SectionKey,
  {
    title: string;
    subtitle: string;
    guidelines: string[];
    scaleNote: string;
    completionNote: string;
  }
> = {
  interests: {
    title: "Interests — What You Enjoy Doing",
    subtitle: "Rate how much each activity sounds like you — or how willing you would be to try it.",
    guidelines: [
      "Answer based on your honest gut reaction. There are no right or wrong answers.",
      "If you have never tried something, rate how willing you would be to explore it.",
      "Try to answer every item. If you are truly stuck, skip and come back.",
    ],
    scaleNote:
      "1 = Not Like Me · 2 = A Little Like Me · 3 = Mostly Like Me · 4 = Very Like Me (If untried: rate your willingness to try it)",
    completionNote: "Complete all 36 questions before moving to the next section.",
  },
  strengths: {
    title: "Strengths — What You Can Do Well",
    subtitle: "Rate how true each statement is for you right now.",
    guidelines: [
      "If you have not tried something yet, rate how confident you feel you could learn it.",
      "Think about real examples from school, home, sports, work, or activities.",
      "Answer honestly — this is for you, not for a grade.",
    ],
    scaleNote:
      "1 = Not Like Me · 2 = A Little Like Me · 3 = Mostly Like Me · 4 = Very Like Me",
    completionNote: "Complete all 36 questions before moving to the next section.",
  },
  drivers: {
    title: "Drivers (Fuel) — Why You Care",
    subtitle: "Rate how true each motivator feels for you right now.",
    guidelines: [
      "Think about what actually energizes you, not what you think you should care about.",
      "There are no right or wrong answers — everyone is motivated by different things.",
      "Answer honestly and do not overthink your responses.",
    ],
    scaleNote:
      "1 = Not Like Me · 2 = A Little Like Me · 3 = Mostly Like Me · 4 = Very Like Me",
    completionNote: "Complete all 36 questions before moving to the next section.",
  },
  conditions: {
    title: "Work Style & Environment — What Work Feels Like",
    subtitle:
      "Rate each statement for what you would want on MOST work days — not just your best or worst day.",
    guidelines: [
      "This section is about preferred conditions, not current abilities.",
      "If two answers both feel true, choose what you would want MOST days.",
      "Tip: Look for patterns in your ratings as you go.",
    ],
    scaleNote:
      "1 = Not Like Me · 2 = A Little Like Me · 3 = Mostly Like Me · 4 = Very Like Me",
    completionNote: "Complete all 36 questions before opening your Results.",
  },
};

export const sectionOrder: SectionKey[] = [
  "interests",
  "strengths",
  "drivers",
  "conditions",
];

export const sectionLabels: Record<SectionKey, string> = {
  interests: "Interests",
  strengths: "Strengths",
  drivers: "Drivers",
  conditions: "Work Style & Environment",
};

export function isValidSection(section: string): section is SectionKey {
  return sectionOrder.includes(section as SectionKey);
}
