export type StudentStatus = "completed" | "in_progress" | "not_started";

export interface AdminStudent {
  id: string;
  email: string;
  fullName: string | null;
  avatarEmoji: string;
  schoolId: string | null;
  schoolName: string | null;
  advisorId: string | null;
  advisorName: string | null;
  status: StudentStatus;
  progressPercent: number;
  topPath: string | null;
  topPathScore: number | null;
  part2Status: StudentStatus;
  part2ProgressPercent: number;
  topRoute: string | null;
  createdAt: string;
}

export interface AdminFilterOption {
  id: string;
  name: string;
}

export interface AdminDashboardData {
  students: AdminStudent[];
  schools: AdminFilterOption[];
  advisors: AdminFilterOption[];
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    part2Completed: number;
  };
  viewerIsSuperAdmin: boolean;
  scopedToAdvisor: boolean;
}
