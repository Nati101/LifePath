import type { SectionKey } from "@/lib/types";

export const startHereInstructions = {
  title: "LifePath Career Exploration Assessment",
  tagline:
    "A strengths-based tool for exploration (not prediction). Designed for students ages 14–18, educators, and families.",
  steps: [
    "Go through each career path section one at a time.",
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
    "Each section focuses on one career path. Your score for each path is based on how strongly you relate to its four questions.",
};

const defaultGuidelines = [
  "Answer based on your honest gut reaction. There are no right or wrong answers.",
  "If you have never tried something, rate how willing you would be to explore it.",
  "Try to answer every item. If you are truly stuck, skip and come back.",
];

const defaultScaleNote =
  "1 = Not Like Me · 2 = A Little Like Me · 3 = Mostly Like Me · 4 = Very Like Me";

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
  clinical_care: {
    title: "Clinical Care Path",
    subtitle: "Care, health, wellbeing; supporting people in recovery and daily needs.",
    guidelines: defaultGuidelines,
    scaleNote: defaultScaleNote,
    completionNote: "Complete all 4 questions before moving to the next section.",
  },
  protection: {
    title: "Protection Path",
    subtitle: "Safety, justice, emergency response; staying calm and decisive under pressure.",
    guidelines: defaultGuidelines,
    scaleNote: defaultScaleNote,
    completionNote: "Complete all 4 questions before moving to the next section.",
  },
  learning_support: {
    title: "Learning & Support Path",
    subtitle: "Teaching, coaching, youth work, community support; helping people grow.",
    guidelines: defaultGuidelines,
    scaleNote: defaultScaleNote,
    completionNote: "Complete all 4 questions before moving to the next section.",
  },
  build_fix: {
    title: "Build & Fix Path",
    subtitle: "Hands-on building/repair, skilled trades, transportation, technical maintenance.",
    guidelines: defaultGuidelines,
    scaleNote: defaultScaleNote,
    completionNote: "Complete all 4 questions before moving to the next section.",
  },
  stem_systems: {
    title: "STEM Systems Path",
    subtitle: "Tech, engineering, data, systems; solving problems with tools and logic.",
    guidelines: defaultGuidelines,
    scaleNote: defaultScaleNote,
    completionNote: "Complete all 4 questions before moving to the next section.",
  },
  business_leadership: {
    title: "Business Growth & Leadership Path",
    subtitle: "Leadership, strategy, selling, organizing teams, entrepreneurship.",
    guidelines: defaultGuidelines,
    scaleNote: defaultScaleNote,
    completionNote: "Complete all 4 questions before moving to the next section.",
  },
  creative: {
    title: "Creative Path",
    subtitle: "Design, media, creative problem-solving; making ideas visible and meaningful.",
    guidelines: defaultGuidelines,
    scaleNote: defaultScaleNote,
    completionNote: "Complete all 4 questions before moving to the next section.",
  },
  experience_service: {
    title: "Experience & Service Path",
    subtitle: "Service, events, food, customer experience; making spaces run smoothly.",
    guidelines: defaultGuidelines,
    scaleNote: defaultScaleNote,
    completionNote: "Complete all 4 questions before moving to the next section.",
  },
  outdoor_systems: {
    title: "Outdoor Systems Path",
    subtitle: "Outdoors, environment, agriculture, animals; caring for land and resources.",
    guidelines: defaultGuidelines,
    scaleNote: defaultScaleNote,
    completionNote: "Complete all 4 questions before moving to the next section.",
  },
};

export const sectionOrder: SectionKey[] = [
  "clinical_care",
  "protection",
  "learning_support",
  "build_fix",
  "stem_systems",
  "business_leadership",
  "creative",
  "experience_service",
  "outdoor_systems",
];

export const sectionLabels: Record<SectionKey, string> = {
  clinical_care: "Clinical Care Path",
  protection: "Protection Path",
  learning_support: "Learning & Support Path",
  build_fix: "Build & Fix Path",
  stem_systems: "STEM Systems Path",
  business_leadership: "Business Growth & Leadership Path",
  creative: "Creative Path",
  experience_service: "Experience & Service Path",
  outdoor_systems: "Outdoor Systems Path",
};

export function isValidSection(section: string): section is SectionKey {
  return sectionOrder.includes(section as SectionKey);
}
