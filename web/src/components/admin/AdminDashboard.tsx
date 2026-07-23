"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { withBasePath } from "@/lib/supabase/client";
import type {
  AdminDashboardData,
  AdminStudent,
  StudentStatus,
} from "@/lib/admin/dashboardTypes";

interface AdminDashboardProps {
  data: AdminDashboardData;
}

const PAGE_SIZE = 50;

const STATUS_LABELS: Record<StudentStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  not_started: "Not started",
};

function StatusBadge({ status }: { status: StudentStatus }) {
  const className =
    status === "completed"
      ? "admin-status-badge admin-status-badge--completed"
      : status === "in_progress"
        ? "admin-status-badge admin-status-badge--progress"
        : "admin-status-badge admin-status-badge--idle";

  return <span className={className}>{STATUS_LABELS[status]}</span>;
}

function ProgressBar({ value, label }: { value: number; label?: string }) {
  const name = label ?? `${value}% complete`;
  return (
    <div className="admin-progress">
      <div
        className="admin-progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-label={name}
      >
        <div className="admin-progress__fill" style={{ width: `${value}%` }} />
      </div>
      <span className="admin-progress__label" aria-hidden>
        {value}%
      </span>
    </div>
  );
}

function StudentRow({ student }: { student: AdminStudent }) {
  const displayName = student.fullName?.trim() || student.email || "Unnamed student";

  return (
    <tr className="admin-row">
      <td className="admin-row__student">
        <div className="admin-row__identity">
          <span className="admin-row__avatar" aria-hidden>
            {student.avatarEmoji}
          </span>
          <div>
            <div className="admin-row__name">{displayName}</div>
            <div className="admin-row__email">{student.email}</div>
          </div>
        </div>
      </td>
      <td className="admin-row__meta admin-col-sm">{student.schoolName ?? "—"}</td>
      <td className="admin-row__meta admin-col-lg">{student.advisorName ?? "—"}</td>
      <td className="admin-row__progress admin-col-md">
        <ProgressBar value={student.progressPercent} label={`Part 1 ${student.progressPercent}%`} />
      </td>
      <td className="admin-row__status">
        <StatusBadge status={student.status} />
      </td>
      <td className="admin-row__progress admin-col-md">
        <ProgressBar
          value={student.part2ProgressPercent}
          label={`Part 2 ${student.part2ProgressPercent}%`}
        />
        <div className="mt-1">
          <StatusBadge status={student.part2Status} />
        </div>
      </td>
      <td className="admin-row__path admin-col-md">
        {student.topPath ? (
          <span>
            {student.topPath}
            {student.topPathScore != null && (
              <span className="admin-row__path-score"> ({student.topPathScore})</span>
            )}
          </span>
        ) : (
          "—"
        )}
        {student.topRoute && (
          <div className="mt-1 text-[12px] text-muted">P2: {student.topRoute}</div>
        )}
      </td>
      <td className="admin-row__action">
        <Link
          href={withBasePath(`/admin/student?id=${student.id}`)}
          className="admin-link"
          aria-label={`View ${displayName}`}
        >
          View
        </Link>
      </td>
    </tr>
  );
}

function StudentCard({ student }: { student: AdminStudent }) {
  const displayName = student.fullName?.trim() || student.email || "Unnamed student";

  return (
    <Link
      href={withBasePath(`/admin/student?id=${student.id}`)}
      className="admin-student-card"
      aria-label={`View ${displayName}`}
    >
      <div className="admin-student-card__header">
        <span className="admin-row__avatar" aria-hidden>
          {student.avatarEmoji}
        </span>
        <div className="admin-student-card__identity">
          <div className="admin-row__name">{displayName}</div>
          <div className="admin-student-card__email">{student.email}</div>
        </div>
      </div>
      <div className="admin-student-card__meta">
        <span>{student.schoolName ?? "No school"}</span>
        <span>{student.advisorName ?? "No advisor"}</span>
      </div>
      <div className="admin-student-card__status-row">
        <div>
          <p className="mb-1 text-[12px] font-medium text-muted">Part 1</p>
          <StatusBadge status={student.status} />
        </div>
        <div>
          <p className="mb-1 text-[12px] font-medium text-muted">Part 2</p>
          <StatusBadge status={student.part2Status} />
        </div>
      </div>
      <p className="mb-1 mt-3 text-[12px] font-medium text-muted">Part 1 progress</p>
      <ProgressBar value={student.progressPercent} label={`Part 1 ${student.progressPercent}%`} />
      <p className="mb-1 mt-3 text-[12px] font-medium text-muted">Part 2 progress</p>
      <ProgressBar
        value={student.part2ProgressPercent}
        label={`Part 2 ${student.part2ProgressPercent}%`}
      />
      {(student.topPath || student.topRoute) && (
        <p className="admin-student-card__path">
          {student.topPath && (
            <>
              Top path: {student.topPath}
              {student.topPathScore != null ? ` (${student.topPathScore})` : ""}
            </>
          )}
          {student.topRoute && (
            <>
              {student.topPath ? " · " : ""}
              Route: {student.topRoute}
            </>
          )}
        </p>
      )}
    </Link>
  );
}

export default function AdminDashboard({ data }: AdminDashboardProps) {
  const [query, setQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [advisorFilter, setAdvisorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">("all");
  const [part2StatusFilter, setPart2StatusFilter] = useState<StudentStatus | "all">("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const hasFilters =
    query.trim() !== "" ||
    schoolFilter !== "all" ||
    advisorFilter !== "all" ||
    statusFilter !== "all" ||
    part2StatusFilter !== "all";

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return data.students.filter((student) => {
      if (schoolFilter !== "all" && student.schoolId !== schoolFilter) return false;
      if (advisorFilter !== "all" && student.advisorId !== advisorFilter) return false;
      if (statusFilter !== "all" && student.status !== statusFilter) return false;
      if (part2StatusFilter !== "all" && student.part2Status !== part2StatusFilter) return false;

      if (!normalizedQuery) return true;

      const haystack = [student.fullName, student.email, student.schoolName, student.advisorName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [advisorFilter, data.students, part2StatusFilter, query, schoolFilter, statusFilter]);

  const visibleStudents = filteredStudents.slice(0, visibleCount);
  const hasMore = filteredStudents.length > visibleCount;

  const completionRate =
    data.stats.total > 0 ? Math.round((data.stats.completed / data.stats.total) * 100) : 0;
  const part2CompletionRate =
    data.stats.total > 0 ? Math.round((data.stats.part2Completed / data.stats.total) * 100) : 0;

  const emptyMessage =
    data.scopedToAdvisor && data.students.length === 0
      ? "You have no assigned students yet."
      : hasFilters
        ? "No students match your filters."
        : "No students found.";

  function clearFilters() {
    setQuery("");
    setSchoolFilter("all");
    setAdvisorFilter("all");
    setStatusFilter("all");
    setPart2StatusFilter("all");
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="admin-page__title">
              {data.scopedToAdvisor ? "My students" : "Dashboard"}
            </h1>
            <p className="admin-page__subtitle">
              {data.scopedToAdvisor
                ? "Monitor Part 1 and Part 2 progress for students assigned to you."
                : "Monitor student progress, filter by school or advisor, and review results."}
            </p>
          </div>
          {data.viewerIsSuperAdmin && (
            <Link
              href={withBasePath("/admin/manage")}
              className="text-[14px] font-medium text-primary hover:underline"
            >
              Manage →
            </Link>
          )}
        </div>
      </div>

      <div className="admin-stat-grid admin-stat-grid--5">
        {[
          { label: "Total students", value: data.stats.total },
          { label: "Part 1 completed", value: data.stats.completed, accent: true },
          { label: "Part 1 in progress", value: data.stats.inProgress },
          { label: "Part 1 not started", value: data.stats.notStarted },
          { label: "Part 2 completed", value: data.stats.part2Completed },
        ].map((stat) => (
          <div key={stat.label} className="admin-stat-card">
            <p className="admin-stat-card__label">{stat.label}</p>
            <p
              className={`admin-stat-card__value${stat.accent ? " admin-stat-card__value--accent" : ""}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="admin-summary-grid">
        <div className="admin-summary-card">
          <div>
            <p className="admin-summary-card__label">Part 1 completion rate</p>
            <p className="admin-summary-card__value">{completionRate}%</p>
          </div>
          <div className="admin-summary-card__bar">
            <div
              className="admin-progress__track admin-progress__track--large"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completionRate}
              aria-label={`Part 1 completion rate ${completionRate}%`}
            >
              <div className="admin-progress__fill" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </div>
        <div className="admin-summary-card">
          <div>
            <p className="admin-summary-card__label">Part 2 completion rate</p>
            <p className="admin-summary-card__value">{part2CompletionRate}%</p>
          </div>
          <div className="admin-summary-card__bar">
            <div
              className="admin-progress__track admin-progress__track--large"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={part2CompletionRate}
              aria-label={`Part 2 completion rate ${part2CompletionRate}%`}
            >
              <div className="admin-progress__fill" style={{ width: `${part2CompletionRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-toolbar surface-card">
        <label className="admin-search">
          <span className="sr-only">Search students</span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search name, email, school, or advisor"
            className="input-field admin-search__input"
          />
        </label>

        <div className="admin-toolbar__filters">
          <select
            value={schoolFilter}
            onChange={(event) => {
              setSchoolFilter(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className="select-field admin-toolbar__select"
            aria-label="Filter by school"
          >
            <option value="all">All schools</option>
            {data.schools.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>

          {!data.scopedToAdvisor && (
            <select
              value={advisorFilter}
              onChange={(event) => {
                setAdvisorFilter(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              className="select-field admin-toolbar__select"
              aria-label="Filter by advisor"
            >
              <option value="all">All advisors</option>
              {data.advisors.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StudentStatus | "all");
              setVisibleCount(PAGE_SIZE);
            }}
            className="select-field admin-toolbar__select"
            aria-label="Filter by Part 1 status"
          >
            <option value="all">All Part 1 statuses</option>
            <option value="completed">Part 1 completed</option>
            <option value="in_progress">Part 1 in progress</option>
            <option value="not_started">Part 1 not started</option>
          </select>

          <select
            value={part2StatusFilter}
            onChange={(event) => {
              setPart2StatusFilter(event.target.value as StudentStatus | "all");
              setVisibleCount(PAGE_SIZE);
            }}
            className="select-field admin-toolbar__select"
            aria-label="Filter by Part 2 status"
          >
            <option value="all">All Part 2 statuses</option>
            <option value="completed">Part 2 completed</option>
            <option value="in_progress">Part 2 in progress</option>
            <option value="not_started">Part 2 not started</option>
          </select>
        </div>

        {hasFilters && (
          <div className="admin-toolbar__cta">
            <button type="button" className="btn-secondary-sm" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}
      </div>

      <div className="admin-results-meta">
        Showing {visibleStudents.length} of {filteredStudents.length} students
        {filteredStudents.length !== data.students.length && (
          <> (filtered from {data.students.length})</>
        )}
      </div>

      <div className="admin-table-wrap surface-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student</th>
              <th className="admin-col-sm">School</th>
              <th className="admin-col-lg">Advisor</th>
              <th className="admin-col-md">Part 1</th>
              <th>P1 status</th>
              <th className="admin-col-md">Part 2</th>
              <th className="admin-col-md">Results</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {visibleStudents.map((student) => (
              <StudentRow key={student.id} student={student} />
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={8} className="admin-empty">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-card-list">
        {visibleStudents.map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
        {filteredStudents.length === 0 && (
          <div className="admin-empty-card surface-card">{emptyMessage}</div>
        )}
      </div>

      {hasMore && (
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          Show more ({filteredStudents.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
}
