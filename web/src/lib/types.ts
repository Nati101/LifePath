export type SectionKey = 
  | "clinical_care"
  | "protection"
  | "learning_support"
  | "build_fix"
  | "stem_systems"
  | "business_leadership"
  | "creative"
  | "experience_service"
  | "outdoor_systems";
export type UserRole = "student" | "admin";

export interface AssessmentItem {
  id: string;
  section: SectionKey;
  text: string;
  primaryPath?: string | null;
  weights?: Record<string, number>;
  construct?: string | null;
  reverse?: boolean;
  constructCode?: string | null;
  primary1?: string | null;
  primary2?: string | null;
  secondary?: string | null;
  secondaryWeight?: number;
  itemWeight?: number;
}

export interface SectionConfig {
  label: string;
  subtitle: string;
  items: AssessmentItem[];
}

export interface AssessmentConfig {
  pathNames: Record<string, string>;
  pathCodes: string[];
  sections: Record<SectionKey, SectionConfig>;
  weights: Record<SectionKey, number>;
  thresholds: {
    veryStrong: number;
    strong: number;
    moderate: number;
    emerging: number;
    tieGap: number;
  };
  fitLabels: Record<string, string>;
  pathDescriptions: Record<string, string>;
  scale: { value: number; label: string }[];
}

export type Responses = Record<string, number>;

export interface PathScore {
  path: string;
  score: number;
  fitLevel: string;
}

export interface AssessmentResult {
  pathScores: PathScore[];
  topPaths: PathScore[];
  constructScores: Record<string, number>;
  sectionCompletion: Record<SectionKey, number>;
  allComplete: boolean;
  tieNote?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  school_name: string | null;
  advisor: string | null;
  school_id: string | null;
  advisor_id: string | null;
  avatar_emoji: string | null;
  is_super_admin: boolean;
  profile_picture_url: string | null;
}
