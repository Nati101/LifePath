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
  return ["interests", "strengths", "drivers", "conditions"];
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

function scoreWeightedSection(
  section: SectionKey,
  responses: Responses,
): Record<string, number> {
  const items = config.sections[section].items;
  const scores: Record<string, number> = {};

  for (const path of PATH_ORDER) {
    const code = Object.entries(config.pathNames).find(([, n]) => n === path)?.[0];
    if (!code) continue;

    let weightedSum = 0;
    let weightTotal = 0;

    for (const item of items) {
      const rating = responses[item.id];
      if (!rating) continue;

      const weight = item.weights?.[code] ?? 0;
      if (weight > 0) {
        weightedSum += rating * weight;
        weightTotal += weight;
      }
    }

    scores[path] =
      weightTotal > 0
        ? Math.round(((weightedSum / weightTotal - 1) / 3) * 100)
        : 0;
  }

  return scores;
}

function scoreConditions(responses: Responses): {
  pathScores: Record<string, number>;
  constructScores: Record<string, number>;
} {
  const items = config.sections.conditions.items;
  const constructScores: Record<string, number> = {};
  const pathScores: Record<string, number> = {};

  const constructGroups: Record<string, number[]> = {};
  for (const item of items) {
    const rating = responses[item.id];
    if (!rating || !item.construct) continue;
    const scored = scoredValue(rating, item.reverse);
    if (!constructGroups[item.construct]) constructGroups[item.construct] = [];
    constructGroups[item.construct].push(scored);
  }

  for (const [construct, values] of Object.entries(constructGroups)) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    constructScores[construct] = Math.round(((avg - 1) / 3) * 100);
  }

  const protectionSignatureIds = new Set(["CON09", "CON12", "CON22", "CON32"]);

  for (const path of PATH_ORDER) {
    let weightedSum = 0;
    let weightTotal = 0;

    for (const item of items) {
      const rating = responses[item.id];
      if (!rating) continue;

      let pathWeight = 0;
      if (item.primary1 === path) pathWeight += 1;
      if (item.primary2 === path) pathWeight += 1;
      if (item.secondary === path)
        pathWeight += item.secondaryWeight ?? 0;

      if (pathWeight <= 0) continue;

      const itemW = item.itemWeight ?? 1;
      const scored = scoredValue(rating, item.reverse);
      weightedSum += scored * itemW * pathWeight;
      weightTotal += itemW * pathWeight;
    }

    if (weightTotal < 4) {
      pathScores[path] = 0;
      continue;
    }

    let score = Math.round(
      ((weightedSum / weightTotal - 1) / 3) * 100,
    );

    if (path === "Protection Path") {
      const sigCount = items.filter(
        (item) =>
          protectionSignatureIds.has(item.id) &&
          responses[item.id] &&
          responses[item.id] >= 3,
      ).length;
      if (sigCount < 2) score = Math.min(score, 55);
    }

    pathScores[path] = score;
  }

  return { pathScores, constructScores };
}

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

export function computeResults(responses: Responses): AssessmentResult {
  const interests = scoreWeightedSection("interests", responses);
  const strengths = scoreWeightedSection("strengths", responses);
  const drivers = scoreWeightedSection("drivers", responses);
  const { pathScores: conditions, constructScores } = scoreConditions(responses);

  const sectionCompletion = getSectionCompletion(responses);
  const allComplete = Object.values(sectionCompletion).every((c) => c >= 1);

  const pathScores: PathScore[] = PATH_ORDER.map((path) => {
    const i = interests[path] ?? 0;
    const s = strengths[path] ?? 0;
    const d = drivers[path] ?? 0;
    const c = conditions[path] ?? 0;

    const weighted = {
      interests: i * config.weights.interests,
      strengths: s * config.weights.strengths,
      drivers: d * config.weights.drivers,
      conditions: c * config.weights.conditions,
    };

    const overall = Math.round(
      weighted.interests + weighted.strengths + weighted.drivers + weighted.conditions,
    );

    const contributors = [
      { name: "Interests", value: weighted.interests },
      { name: "Strengths", value: weighted.strengths },
      { name: "Drivers", value: weighted.drivers },
      { name: "Work Style & Environment", value: weighted.conditions },
    ];
    const top = contributors.reduce((a, b) => (b.value > a.value ? b : a));

    return {
      path,
      interests: i,
      strengths: s,
      drivers: d,
      conditions: c,
      overall,
      fitLevel: getFitLevel(overall),
      topContributor: top.name,
    };
  });

  const sorted = [...pathScores].sort((a, b) => b.overall - a.overall);
  const topPaths = sorted.slice(0, 3);

  let tieNote: string | undefined;
  if (
    topPaths.length >= 2 &&
    topPaths[0].overall - topPaths[1].overall <= config.thresholds.tieGap
  ) {
    tieNote = "Your Top 2 are very close—explore BOTH.";
  }

  return {
    pathScores: sorted,
    topPaths,
    constructScores,
    sectionCompletion,
    allComplete,
    tieNote,
  };
}

export { PATH_ORDER, config };
