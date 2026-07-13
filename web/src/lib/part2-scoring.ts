import part2Data from "@/data/part2-assessment-data.json";
import type {
  Part2AssessmentConfig,
  Part2Responses,
  Part2Result,
  Part2RouteScore,
  Part2SectionKey,
} from "./part2-types";

const config = part2Data as unknown as Part2AssessmentConfig;

const ROUTE_ORDER = [
  "University Degree Route",
  "College / Polytechnic Route",
  "Trades / Apprenticeship Route",
  "Work-First + Upgrade Route",
  "Gap / Explore Route",
  "Entrepreneur / Create Route",
];

export function getPart2Config() {
  return config;
}

export function getAllPart2Items() {
  return Object.values(config.sections).flatMap((s) => s.items);
}

export function getPart2SectionItems(section: Part2SectionKey) {
  return config.sections[section].items;
}

export function getPart2SectionOrder(): Part2SectionKey[] {
  return ["school_setup", "training_style", "life_factors", "exploration"];
}

// Calculate factor scores from responses (0-100 scale)
function calculateFactorScores(responses: Part2Responses): Record<string, number> {
  const factorScores: Record<string, number> = {};
  const factorValues: Record<string, number[]> = {};

  // Group responses by factor
  const allItems = getAllPart2Items();
  for (const item of allItems) {
    const rating = responses[item.id];
    if (rating && item.factor) {
      if (!factorValues[item.factor]) {
        factorValues[item.factor] = [];
      }
      factorValues[item.factor].push(rating);
    }
  }

  // Calculate average for each factor and convert to 0-100 scale
  for (const [factor, values] of Object.entries(factorValues)) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    // Convert 1-4 scale to 0-100: ((avg - 1) / 3) * 100
    factorScores[factor] = Math.round(((avg - 1) / 3) * 100);
  }

  return factorScores;
}

// Calculate route scores using factor weights
function calculateRouteScores(
  factorScores: Record<string, number>,
): Part2RouteScore[] {
  const routeScores: Part2RouteScore[] = [];

  for (const route of ROUTE_ORDER) {
    const routeCode = Object.entries(config.routeNames).find(
      ([, name]) => name === route,
    )?.[0];
    
    if (!routeCode) continue;

    let weightedSum = 0;
    const factorContributions: Record<string, number> = {};

    // Sum weighted contributions from each factor
    for (const [factor, score] of Object.entries(factorScores)) {
      const weight = config.factorWeights[factor]?.[routeCode] ?? 0;
      const contribution = score * weight;
      weightedSum += contribution;
      factorContributions[factor] = contribution;
    }

    // Base score is 50, then add weighted sum
    const finalScore = Math.max(0, Math.min(100, Math.round(50 + weightedSum)));

    // Determine fit level
    let fitLevel = "Low Fit";
    if (finalScore >= config.thresholds.high) {
      fitLevel = config.fitLabels.high;
    } else if (finalScore >= config.thresholds.medium) {
      fitLevel = config.fitLabels.medium;
    } else {
      fitLevel = config.fitLabels.low;
    }

    routeScores.push({
      route,
      score: finalScore,
      fitLevel,
      factorContributions,
    });
  }

  return routeScores;
}

// Calculate action readiness score
function calculateActionReadiness(
  factorScores: Record<string, number>,
): { score: number; level: string } {
  // Action readiness factors: EX, HS, PL, BP, SS, (100-LM), TR, SF, EB
  const readinessFactors = ["EX", "HS", "PL", "BP", "SS", "TR", "SF", "EB"];
  const values: number[] = [];

  for (const factor of readinessFactors) {
    if (factorScores[factor] !== undefined) {
      values.push(factorScores[factor]);
    }
  }

  // Add inverted low motivation (higher motivation = higher readiness)
  if (factorScores["LM"] !== undefined) {
    values.push(100 - factorScores["LM"]);
  }

  const avgScore = values.length > 0
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 0;

  let level = "Exploration Mode";
  if (avgScore >= 75) {
    level = "Ready to Act";
  } else if (avgScore >= 55) {
    level = "Almost Ready";
  }

  return { score: avgScore, level };
}

export function getPart2SectionCompletion(
  responses: Part2Responses,
): Record<Part2SectionKey, number> {
  const completion = {} as Record<Part2SectionKey, number>;
  
  for (const section of getPart2SectionOrder()) {
    const total = config.sections[section].items.length;
    const answered = config.sections[section].items.filter(
      (i) => responses[i.id] != null,
    ).length;
    completion[section] = total > 0 ? answered / total : 0;
  }
  
  return completion;
}

export function computePart2Results(responses: Part2Responses): Part2Result {
  const sectionCompletion = getPart2SectionCompletion(responses);
  const allComplete = Object.values(sectionCompletion).every((c) => c >= 1);

  // Calculate factor scores
  const factorScores = calculateFactorScores(responses);

  // Calculate route scores
  const routeScores = calculateRouteScores(factorScores);
  const sorted = [...routeScores].sort((a, b) => b.score - a.score);
  const topRoutes = sorted.slice(0, 3);

  // Calculate action readiness
  const { score: actionReadiness, level: actionReadinessLevel } =
    calculateActionReadiness(factorScores);

  // Check for tie note
  let tieNote: string | undefined;
  if (
    topRoutes.length >= 2 &&
    topRoutes[0].score - topRoutes[1].score <= config.thresholds.tieGap
  ) {
    tieNote = "Your Top 2 routes are close — explore BOTH to find the best blend.";
  }

  return {
    routeScores: sorted,
    topRoutes,
    factorScores,
    sectionCompletion,
    allComplete,
    actionReadiness,
    actionReadinessLevel,
    tieNote,
  };
}

export { config as part2Config };
