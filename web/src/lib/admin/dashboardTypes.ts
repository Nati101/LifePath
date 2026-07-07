export type StudentStatus = "completed" | "in_progress" | "not_started";

export interface AdminStudent {
  id: string;
  email: string;
  fullName: string | null;
  avatarEmoji: string;
  classId: string | null;
  className: string | null;
  advisorId: string | null;
  advisorName: string | null;
  status: StudentStatus;
  progressPercent: number;
  topPath: string | null;
  topPathScore: number | null;
  createdAt: string;
}

export interface AdminFilterOption {
  id: string;
  name: string;
}

export interface AdminDashboardData {
  students: AdminStudent[];
  classes: AdminFilterOption[];
  advisors: AdminFilterOption[];
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
}
