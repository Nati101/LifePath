import assessmentData from "@/data/assessment-data.json";
import type {
  AssessmentConfig,
  AssessmentResult,
  PathScore,
  Responses,
  SectionKey,
} from "./types";

const config = assessmentData as unknown as AssessmentConfig;

const PATH_NAMES = Object.values(config.pathNames);
const PATH_ORDER = [
  "Clinical Care Path",
  "Protection Path",
  "Learning & Support Path",
  "Build & Fix Path",
  "STEM Systems Path",
  "Business Growth & Leadership Path",
  "Creative Path",
  "Experience & Service Path",
  "Outdoor Systems Path",
];

const CODE_TO_PATH: Record<string, string> = {};
for (const [code, name] of Object.entries(config.pathNames)) {
  CODE_TO_PATH[code] = name;
}

export function getConfig() {
  return config;
}

export function getAllItems() {
  return Object.values(config.sections).flatMap((s) => s.items);
}

export function getSectionItems(section: SectionKey) {
  return config.sections[section].items;
}

export function getSectionOrder(): SectionKey[] {
  return [
    "clinical_care",
    "protection",
    "learning_support",
    "build_fix",
    "stem_systems",
    "business_leadership",
    "creative",
    "experience_service",
    "outdoor_systems"
  ];
}

function scoredValue(rating: number, reverse?: boolean): number {
  return reverse ? 5 - rating : rating;
}

function getFitLevel(score: number): string {
  const { thresholds, fitLabels } = config;
  if (score >= thresholds.veryStrong) return fitLabels.veryStrong;
  if (score >= thresholds.strong) return fitLabels.strong;
  if (score >= thresholds.moderate) return fitLabels.moderate;
  if (score >= thresholds.emerging) return fitLabels.emerging;
  return fitLabels.low;
}

// Map section keys to their corresponding path names
const SECTION_TO_PATH: Record<SectionKey, string> = {
  "clinical_care": "Clinical Care Path",
  "protection": "Protection Path",
  "learning_support": "Learning & Support Path",
  "build_fix": "Build & Fix Path",
  "stem_systems": "STEM Systems Path",
  "business_leadership": "Business Growth & Leadership Path",
  "creative": "Creative Path",
  "experience_service": "Experience & Service Path",
  "outdoor_systems": "Outdoor Systems Path"
};

export function getSectionCompletion(responses: Responses): Record<SectionKey, number> {
  const completion = {} as Record<SectionKey, number>;
  for (const section of getSectionOrder()) {
    const total = config.sections[section].items.length;
    const answered = config.sections[section].items.filter(
      (i) => responses[i.id] != null,
    ).length;
    completion[section] = total > 0 ? answered / total : 0;
  }
  return completion;
}

function calculatePathScore(section: SectionKey, responses: Responses): number {
  const items = config.sections[section].items;
  let totalScore = 0;
  let totalQuestions = 0;

  for (const item of items) {
    const rating = responses[item.id];
    if (rating) {
      totalScore += rating;
      totalQuestions++;
    }
  }

  if (totalQuestions === 0) return 0;
  
  // Convert average rating (1-4) to percentage (0-100)
  const averageRating = totalScore / totalQuestions;
  return Math.round(((averageRating - 1) / 3) * 100);
}

export function computeResults(responses: Responses): AssessmentResult {
  const sectionCompletion = getSectionCompletion(responses);
  const allComplete = Object.values(sectionCompletion).every((c) => c >= 1);

  const pathScores: PathScore[] = getSectionOrder().map((section) => {
    const path = SECTION_TO_PATH[section];
    const score = calculatePathScore(section, responses);
    
    return {
      path,
      score,
      fitLevel: getFitLevel(score),
    };
  });

  const sorted = [...pathScores].sort((a, b) => b.score - a.score);
  const topPaths = sorted.slice(0, 3);

  let tieNote: string | undefined;
  if (
    topPaths.length >= 2 &&
    topPaths[0].score - topPaths[1].score <= config.thresholds.tieGap
  ) {
    tieNote = "Your Top 2 are very close—explore BOTH.";
  }

  return {
    pathScores: sorted,
    topPaths,
    constructScores: {}, // No longer using constructs with new structure
    sectionCompletion,
    allComplete,
    tieNote,
  };
}

export { PATH_ORDER, config };
