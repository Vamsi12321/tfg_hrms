"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listDepartments, listEmployees, getEmployeeDetail,
  listCycles, listOKRs, getOKRDetail, listReviews,
  getLeaderboard, getPerformanceAnalytics,
  listCompanyDocuments, listTemplates, listDocumentRequests,
  listEmployeeDocuments, listWellnessPrograms,
  getWellnessDashboard, getWellnessAnalytics, getMoodHistory,
  getLeaveBalance, getLeaveConfig, listLeaves, listHolidays,
  listAnnouncements, listAdminUsers, listOfficeLocations,
  getOnboardingProgress, getAttendanceSummary,
  listAttendanceRecords, listRegularizations, getAttendanceConfig
} from "@/lib/api";

// ── Department Queries ────────────────────────────────────────────────────

export function useDepartments(params = {}) {
  return useQuery({
    queryKey: ["departments", params],
    queryFn: async () => {
      const res = await listDepartments(params);
      if (res.ok && res.data) return res.data.departments || res.data || [];
      return [];
    },
  });
}

// ── Employee Queries ──────────────────────────────────────────────────────

export function useEmployees(params = {}) {
  return useQuery({
    queryKey: ["employees", params],
    queryFn: async () => {
      const res = await listEmployees(params);
      return res.ok ? res.data : { employees: [], total: 0, page: 1, pages: 1 };
    },
    keepPreviousData: true,
  });
}

export function useEmployeeDetail(employeeId) {
  return useQuery({
    queryKey: ["employee", employeeId],
    queryFn: async () => {
      const res = await getEmployeeDetail(employeeId);
      return res.ok ? res.data : null;
    },
    enabled: !!employeeId,
  });
}

// ── Performance Queries ───────────────────────────────────────────────────

export function useCycles(params = {}) {
  return useQuery({
    queryKey: ["cycles", params],
    queryFn: async () => {
      const res = await listCycles(params);
      return res.ok ? (res.data.cycles || []) : [];
    },
  });
}

export function useOKRs(params = {}) {
  return useQuery({
    queryKey: ["okrs", params],
    queryFn: async () => {
      const res = await listOKRs(params);
      return res.ok ? res.data : { okrs: [], total: 0 };
    },
    enabled: !!params.cycle_id,
  });
}

export function useReviews(params = {}) {
  return useQuery({
    queryKey: ["reviews", params],
    queryFn: async () => {
      const res = await listReviews(params);
      return res.ok ? (res.data.reviews || []) : [];
    },
    enabled: !!params.cycle_id,
  });
}

export function useLeaderboard(params = {}) {
  return useQuery({
    queryKey: ["leaderboard", params],
    queryFn: async () => {
      const res = await getLeaderboard(params);
      return res.ok ? (res.data.leaderboard || []) : [];
    },
    enabled: !!params.cycle_id,
  });
}

export function usePerformanceAnalytics(params = {}) {
  return useQuery({
    queryKey: ["performance-analytics", params],
    queryFn: async () => {
      const res = await getPerformanceAnalytics(params);
      return res.ok ? res.data : null;
    },
    enabled: !!params.cycle_id,
  });
}

// ── Document Queries ──────────────────────────────────────────────────────

export function useCompanyDocuments(params = {}) {
  return useQuery({
    queryKey: ["company-documents", params],
    queryFn: async () => {
      const res = await listCompanyDocuments(params);
      return res.ok ? (res.data.documents || res.data || []) : [];
    },
  });
}

export function useTemplates(params = {}) {
  return useQuery({
    queryKey: ["templates", params],
    queryFn: async () => {
      const res = await listTemplates(params);
      return res.ok ? (res.data.templates || res.data || []) : [];
    },
  });
}

export function useDocumentRequests(params = {}) {
  return useQuery({
    queryKey: ["document-requests", params],
    queryFn: async () => {
      const res = await listDocumentRequests(params);
      return res.ok ? (res.data.requests || res.data || []) : [];
    },
  });
}

export function useEmployeeDocuments(params = {}) {
  return useQuery({
    queryKey: ["employee-documents", params],
    queryFn: async () => {
      const res = await listEmployeeDocuments(params);
      return res.ok ? (res.data.documents || res.data || []) : [];
    },
  });
}

// ── Wellness Queries ──────────────────────────────────────────────────────

export function useWellnessDashboard(params = {}) {
  return useQuery({
    queryKey: ["wellness-dashboard", params],
    queryFn: async () => {
      const res = await getWellnessDashboard(params);
      return res.ok ? res.data : null;
    },
  });
}

export function useWellnessAnalytics(params = {}) {
  return useQuery({
    queryKey: ["wellness-analytics", params],
    queryFn: async () => {
      const res = await getWellnessAnalytics(params);
      return res.ok ? res.data : null;
    },
  });
}

export function useWellnessPrograms(params = {}) {
  return useQuery({
    queryKey: ["wellness-programs", params],
    queryFn: async () => {
      const res = await listWellnessPrograms(params);
      return res.ok ? (res.data.programs || res.data || []) : [];
    },
  });
}

export function useMoodHistory(days = 30) {
  return useQuery({
    queryKey: ["mood-history", days],
    queryFn: async () => {
      const res = await getMoodHistory(days);
      return res.ok ? res.data : null;
    },
  });
}

// ── Leave Queries ─────────────────────────────────────────────────────────

export function useLeaveBalance() {
  return useQuery({
    queryKey: ["leave-balance"],
    queryFn: async () => {
      const res = await getLeaveBalance();
      return res.ok ? (res.data.balances || []) : [];
    },
  });
}

export function useLeaveConfig() {
  return useQuery({
    queryKey: ["leave-config"],
    queryFn: async () => {
      const res = await getLeaveConfig();
      return res.ok ? (res.data.leave_types || []) : [];
    },
  });
}

export function useLeaves(params = {}) {
  return useQuery({
    queryKey: ["leaves", params],
    queryFn: async () => {
      const res = await listLeaves(params);
      return res.ok ? (res.data.leaves || []) : [];
    },
  });
}

export function useHolidays(params = {}) {
  return useQuery({
    queryKey: ["holidays", params],
    queryFn: async () => {
      const res = await listHolidays(params);
      return res.ok ? (res.data.holidays || []) : [];
    },
  });
}

// ── Announcements ─────────────────────────────────────────────────────────

export function useAnnouncements(params = {}) {
  return useQuery({
    queryKey: ["announcements", params],
    queryFn: async () => {
      const res = await listAnnouncements(params);
      return res.ok ? res.data : { announcements: [], total: 0 };
    },
  });
}

// ── Admin Users ───────────────────────────────────────────────────────────

export function useAdminUsers(params = {}) {
  return useQuery({
    queryKey: ["admin-users", params],
    queryFn: async () => {
      const res = await listAdminUsers(params);
      return res.ok ? res.data : { users: [], total: 0, pages: 1 };
    },
    keepPreviousData: true,
  });
}

// ── Onboarding ────────────────────────────────────────────────────────────

export function useOnboardingProgress(employeeId = null) {
  return useQuery({
    queryKey: ["onboarding", employeeId],
    queryFn: async () => {
      const res = await getOnboardingProgress(employeeId);
      return res.ok ? res.data : null;
    },
  });
}

// ── Invalidation helper ───────────────────────────────────────────────────

export function useInvalidate() {
  const queryClient = useQueryClient();
  return (key) => queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
}


// ── Attendance Queries ────────────────────────────────────────────────────

import {
  getDailyAttendanceReport, getMonthlyAttendanceReport,
  getMoodEntries
} from "@/lib/api";

export function useAttendanceSummary(params = {}) {
  return useQuery({
    queryKey: ["attendance-summary", params],
    queryFn: async () => {
      const res = await getAttendanceSummary(params);
      return res.ok ? (res.data.summary || []) : [];
    },
    enabled: !!params.month && !!params.year,
  });
}

export function useAttendanceRecords(params = {}) {
  return useQuery({
    queryKey: ["attendance-records", params],
    queryFn: async () => {
      const res = await listAttendanceRecords(params);
      return res.ok ? res.data : { records: [], total: 0 };
    },
  });
}

export function useRegularizations(params = {}) {
  return useQuery({
    queryKey: ["regularizations", params],
    queryFn: async () => {
      const res = await listRegularizations(params);
      return res.ok ? (res.data.regularizations || res.data.requests || []) : [];
    },
  });
}

export function useAttendanceConfig() {
  return useQuery({
    queryKey: ["attendance-config"],
    queryFn: async () => {
      const res = await getAttendanceConfig();
      return res.ok ? res.data : null;
    },
  });
}

export function useOfficeLocations() {
  return useQuery({
    queryKey: ["office-locations"],
    queryFn: async () => {
      const res = await listOfficeLocations();
      return res.ok ? (res.data.locations || res.data || []) : [];
    },
  });
}

export function useDailyAttendanceReport(params = {}) {
  return useQuery({
    queryKey: ["attendance-daily", params],
    queryFn: async () => {
      const res = await getDailyAttendanceReport(params);
      return res.ok ? res.data : null;
    },
    enabled: !!params.date,
  });
}

export function useMonthlyAttendanceReport(params = {}) {
  return useQuery({
    queryKey: ["attendance-monthly", params],
    queryFn: async () => {
      const res = await getMonthlyAttendanceReport(params);
      return res.ok ? res.data : null;
    },
    enabled: !!params.month && !!params.year,
  });
}

// ── Mood Entries (HR view) — GET /hrms/wellness/mood/entries ──────────────

export function useMoodEntries(params = {}) {
  return useQuery({
    queryKey: ["mood-entries", params],
    queryFn: async () => {
      const res = await getMoodEntries(params);
      return res.ok ? res.data : { entries: [], total: 0, summary: null };
    },
  });
}


import { getPayrollConfig, listPayrollRuns, listPayslips, getMyPayslips, getPayrollSummary, listPayrollAdjustments, getBankTransferReport, getSalaryRegisterReport, getDepartmentPayrollReport } from "@/lib/api";

export function usePayrollConfig(params = {}) {
  return useQuery({
    queryKey: ["payroll-config", params],
    queryFn: async () => {
      const res = await getPayrollConfig(params);
      return res.ok ? res.data : null;
    },
  });
}

export function usePayrollRuns(params = {}) {
  return useQuery({
    queryKey: ["payroll-runs", params],
    queryFn: async () => {
      const res = await listPayrollRuns(params);
      return res.ok ? res.data : { runs: [], total: 0 };
    },
  });
}

export function usePayslips(params = {}) {
  return useQuery({
    queryKey: ["payslips", params],
    queryFn: async () => {
      const res = await listPayslips(params);
      return res.ok ? res.data : { payslips: [], total: 0 };
    },
  });
}

export function useMyPayslips(params = {}) {
  return useQuery({
    queryKey: ["my-payslips", params],
    queryFn: async () => {
      const res = await getMyPayslips(params);
      return res.ok ? res.data : { payslips: [] };
    },
  });
}

export function usePayrollSummary(params = {}) {
  return useQuery({
    queryKey: ["payroll-summary", params],
    queryFn: async () => {
      const res = await getPayrollSummary(params);
      return res.ok ? res.data : null;
    },
    enabled: !!params.month && !!params.year,
  });
}

export function usePayrollAdjustments(params = {}) {
  return useQuery({
    queryKey: ["payroll-adjustments", params],
    queryFn: async () => {
      const res = await listPayrollAdjustments(params);
      return res.ok ? res.data : { adjustments: [] };
    },
  });
}

export function usePayrollBankTransfer(params = {}) {
  return useQuery({
    queryKey: ["payroll-bank-transfer", params],
    queryFn: async () => {
      const res = await getBankTransferReport(params);
      return res.ok ? res.data : { entries: [] };
    },
    enabled: !!params.month && !!params.year,
  });
}

export function usePayrollSalaryRegister(params = {}) {
  return useQuery({
    queryKey: ["payroll-salary-register", params],
    queryFn: async () => {
      const res = await getSalaryRegisterReport(params);
      return res.ok ? res.data : { register: [], total_employees: 0 };
    },
    enabled: !!params.month && !!params.year,
  });
}

export function usePayrollDepartmentReport(params = {}) {
  return useQuery({
    queryKey: ["payroll-department-report", params],
    queryFn: async () => {
      const res = await getDepartmentPayrollReport(params);
      return res.ok ? res.data : { departments: [] };
    },
    enabled: !!params.month && !!params.year,
  });
}


// ── Work Management Queries ───────────────────────────────────────────────

import {
  listProjects, listWorkItems, getWorkItemDetail,
  getMyTimesheets, getTeamTimesheets,
  getMyDailyUpdates, getTeamDailyUpdates
} from "@/lib/api";

export function useProjects(params = {}) {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: async () => {
      const res = await listProjects(params);
      return res.ok ? res.data : { projects: [], total: 0 };
    },
  });
}

export function useWorkItems(params = {}) {
  return useQuery({
    queryKey: ["work-items", params],
    queryFn: async () => {
      const res = await listWorkItems(params);
      return res.ok ? res.data : { work_items: [], total: 0 };
    },
  });
}

export function useWorkItemDetail(itemId) {
  return useQuery({
    queryKey: ["work-item", itemId],
    queryFn: async () => {
      const res = await getWorkItemDetail(itemId);
      return res.ok ? res.data : null;
    },
    enabled: !!itemId,
  });
}

export function useMyTimesheets(params = {}) {
  return useQuery({
    queryKey: ["my-timesheets", params],
    queryFn: async () => {
      const res = await getMyTimesheets(params);
      return res.ok ? res.data : { timesheets: [], total: 0 };
    },
  });
}

export function useTeamTimesheets(params = {}) {
  return useQuery({
    queryKey: ["team-timesheets", params],
    queryFn: async () => {
      const res = await getTeamTimesheets(params);
      return res.ok ? res.data : { timesheets: [], total: 0 };
    },
  });
}

export function useMyDailyUpdates(params = {}) {
  return useQuery({
    queryKey: ["my-daily-updates", params],
    queryFn: async () => {
      const res = await getMyDailyUpdates(params);
      return res.ok ? res.data : { updates: [], total: 0 };
    },
  });
}

export function useTeamDailyUpdates(params = {}) {
  return useQuery({
    queryKey: ["team-daily-updates", params],
    queryFn: async () => {
      const res = await getTeamDailyUpdates(params);
      return res.ok ? res.data : { updates: [], total: 0 };
    },
  });
}


// ── Analytics Dashboard ───────────────────────────────────────────────────

import { getAnalyticsDashboard } from "@/lib/api";

export function useAnalyticsDashboard(params = {}) {
  return useQuery({
    queryKey: ["analytics-dashboard", params],
    queryFn: async () => {
      const res = await getAnalyticsDashboard(params);
      return res.ok ? res.data : null;
    },
    staleTime: 5 * 60 * 1000, // cache 5 min
  });
}
