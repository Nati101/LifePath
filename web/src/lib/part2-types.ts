export type Part2SectionKey = "school_setup" | "training_style" | "life_factors" | "exploration";

export interface Part2AssessmentItem {
  id: string;
  section: Part2SectionKey;
  text: string;
  factor: string;
}

export interface Part2SectionConfig {
  label: string;
  subtitle: string;
  items: Part2AssessmentItem[];
}

export interface Part2AssessmentConfig {
  routeNames: Record<string, string>;
  routeCodes: string[];
  sections: Record<Part2SectionKey, Part2SectionConfig>;
  factorWeights: Record<string, Record<string, number>>;
  factorNames: Record<string, string>;
  thresholds: {
    high: number;
    medium: number;
    tieGap: number;
  };
  fitLabels: Record<string, string>;
  routeDescriptions: Record<string, string>;
  scale: { value: number; label: string }[];
}

export type Part2Responses = Record<string, number>;

export interface Part2RouteScore {
  route: string;
  score: number;
  fitLevel: string;
  factorContributions: Record<string, number>;
}

export interface Part2Result {
  routeScores: Part2RouteScore[];
  topRoutes: Part2RouteScore[];
  factorScores: Record<string, number>;
  sectionCompletion: Record<Part2SectionKey, number>;
  allComplete: boolean;
  actionReadiness: number;
  actionReadinessLevel: string;
  tieNote?: string;
}

export interface Part2Session {
  id: string;
  user_id: string;
  status: 'in_progress' | 'completed';
  current_section: Part2SectionKey;
  current_index: number;
  started_at: string;
  completed_at?: string;
  updated_at: string;
}

export interface Part2Response {
  id: string;
  session_id: string;
  user_id: string;
  item_id: string;
  section: Part2SectionKey;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface Part2StoredResult {
  id: string;
  session_id: string;
  user_id: string;
  route_scores: Part2RouteScore[];
  top_routes: Part2RouteScore[];
  factor_scores: Record<string, number>;
  action_readiness: number;
  action_readiness_level: string;
  computed_at: string;
}
