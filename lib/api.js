// ============================================
// TFG HRMS - API Helper
// ============================================

// All API calls go through the proxy route to handle cookies/auth
const PROXY_URL = "/api/proxy";

async function request(method, path, body = null, params = {}) {
  const url = new URL(PROXY_URL, window.location.origin);

  // Cap limit to 100 (backend max) for all list endpoints
  if (params.limit && parseInt(params.limit) > 100) params.limit = 100;

  // Add query params
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      url.searchParams.set(key, val);
    }
  });

  const headers = {
    "x-target-path": path,
    "Content-Type": "application/json",
  };

  const options = { method, headers, credentials: "include" };
  if (body && method !== "GET" && method !== "HEAD") {
    options.body = JSON.stringify(body);
  }

  let res = await fetch(url.toString(), options);

  // Handle 401 — attempt token refresh, then retry once
  if (res.status === 401) {
    const refreshRes = await fetch(new URL(PROXY_URL, window.location.origin).toString(), {
      method: "POST",
      credentials: "include",
      headers: { "x-target-path": "/hrms/auth/refresh", "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (refreshRes.ok) {
      // Retry the original request
      res = await fetch(url.toString(), options);
    } else {
      // Refresh failed — token fully expired, force logout
      if (typeof window !== "undefined") {
        localStorage.removeItem("tfg_hrms_user");
        window.location.href = "/login";
      }
      return { ok: false, status: 401, data: { detail: "Session expired. Please login again." } };
    }
  }

  let data;
  try {
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  } catch {
    data = null;
  }

  return { ok: res.ok, status: res.status, data };
}

// ── User Management APIs ──────────────────────────────────────────────────

export async function createAdminUser({ email, full_name, phone, role, organization_id }) {
  const body = { email, full_name, phone, role };
  if (organization_id) body.organization_id = organization_id;
  return request("POST", "/hrms/users/", body);
}

export async function listAdminUsers({ page = 1, limit = 10, include_inactive = false } = {}) {
  return request("GET", "/hrms/users/", null, { page, limit, include_inactive });
}

export async function getUserById(userId) {
  return request("GET", `/hrms/users/${userId}`);
}

export async function updateAdminUser(userId, updates) {
  return request("PUT", `/hrms/users/${userId}`, updates);
}

export async function deactivateAdminUser(userId) {
  return request("DELETE", `/hrms/users/${userId}`);
}

// ── Organization APIs ─────────────────────────────────────────────────────

export async function createOrganization(data) {
  return request("POST", "/hrms/organizations/", data);
}

export async function listOrganizations({ page = 1, limit = 100, include_deleted = false } = {}) {
  return request("GET", "/hrms/organizations/", null, { page, limit, include_deleted });
}

export async function getOrganizationById(orgId) {
  return request("GET", `/hrms/organizations/${orgId}`);
}

export async function updateOrganization(orgId, data) {
  return request("PUT", `/hrms/organizations/${orgId}`, data);
}

export async function deleteOrganization(orgId) {
  return request("DELETE", `/hrms/organizations/${orgId}`);
}

export async function getMyOrganization() {
  return request("GET", "/hrms/organizations/me");
}

export async function updateMyOrganization(data) {
  return request("PUT", "/hrms/organizations/me", data);
}

export async function checkAdminUserLimit(orgId) {
  return request("GET", `/hrms/organizations/${orgId}/admin-user-limit`);
}

// ── Employee APIs ─────────────────────────────────────────────────────────

export async function createEmployee(data) {
  return request("POST", "/hrms/employees/", data);
}

export async function listEmployees({ page = 1, limit = 10, status, department, search, include_deleted = false, organization_id } = {}) {
  return request("GET", "/hrms/employees/", null, { page, limit: Math.min(limit, 100), status, department, search, include_deleted, organization_id });
}

export async function getEmployeeDetail(employeeId) {
  return request("GET", `/hrms/employees/${employeeId}`);
}

export async function updateEmployee(employeeId, data) {
  return request("PUT", `/hrms/employees/${employeeId}`, data);
}

export async function deactivateEmployee(employeeId) {
  return request("DELETE", `/hrms/employees/${employeeId}`);
}

export async function importEmployeesCSV(file) {
  const url = new URL("/api/proxy", window.location.origin);
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(url.toString(), {
    method: "POST",
    credentials: "include",
    headers: { "x-target-path": "/hrms/employees/import" },
    body: formData,
  });

  let data;
  try { data = await res.json(); } catch { data = null; }
  return { ok: res.ok, status: res.status, data };
}

// ── Employee Onboarding APIs ──────────────────────────────────────────────

export async function submitOnboardingSection(section, data, employeeId = null) {
  const params = employeeId ? { employee_id: employeeId } : {};
  return request("PUT", `/hrms/employees/me/onboarding/${section}`, { data }, params);
}

export async function getOnboardingProgress(employeeId = null) {
  const params = employeeId ? { employee_id: employeeId } : {};
  return request("GET", "/hrms/employees/me/onboarding", null, params);
}

export async function verifyEmployee(employeeId, body) {
  // body: { action: "approve" } or { action: "verify_section", section: "bank_details" }
  // or { action: "request_changes", sections: [...], notes: "..." }
  return request("PATCH", `/hrms/employees/${employeeId}/verify`, body);
}

// ── File Upload APIs ──────────────────────────────────────────────────────

export async function uploadFile(file, category = "other", employeeId = null) {
  const url = new URL("/api/proxy", window.location.origin);
  if (category) url.searchParams.set("category", category);
  if (employeeId) url.searchParams.set("employee_id", employeeId);

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(url.toString(), {
    method: "POST",
    credentials: "include",
    headers: { "x-target-path": "/hrms/upload/" },
    body: formData,
  });

  let data;
  try { const text = await res.text(); data = JSON.parse(text); } catch { data = null; }
  return { ok: res.ok, status: res.status, data };
}

export async function uploadMultipleFiles(files, category = "document", employeeId = null) {
  const url = new URL("/api/proxy", window.location.origin);
  if (category) url.searchParams.set("category", category);
  if (employeeId) url.searchParams.set("employee_id", employeeId);

  const formData = new FormData();
  files.forEach(f => formData.append("files", f));

  const res = await fetch(url.toString(), {
    method: "POST",
    credentials: "include",
    headers: { "x-target-path": "/hrms/upload/multiple" },
    body: formData,
  });

  let data;
  try { const text = await res.text(); data = JSON.parse(text); } catch { data = null; }
  return { ok: res.ok, status: res.status, data };
}

// ── Performance & OKR APIs ────────────────────────────────────────────────

// Cycles
export async function createCycle(data) {
  return request("POST", "/hrms/performance/cycles", data);
}

export async function listCycles(params = {}) {
  return request("GET", "/hrms/performance/cycles", null, params);
}

export async function updateCycle(cycleId, data) {
  return request("PUT", `/hrms/performance/cycles/${cycleId}`, data);
}

// OKRs
export async function createOKR(data) {
  return request("POST", "/hrms/performance/okrs", data);
}

export async function listOKRs(params = {}) {
  return request("GET", "/hrms/performance/okrs", null, params);
}

export async function getOKRDetail(okrId) {
  return request("GET", `/hrms/performance/okrs/${okrId}`);
}

export async function updateOKR(okrId, data) {
  return request("PUT", `/hrms/performance/okrs/${okrId}`, data);
}

export async function deleteOKR(okrId) {
  return request("DELETE", `/hrms/performance/okrs/${okrId}`);
}

// Reviews
export async function submitReview(data) {
  return request("POST", "/hrms/performance/reviews", data);
}

export async function listReviews(params = {}) {
  return request("GET", "/hrms/performance/reviews", null, params);
}

export async function getReviewDetail(reviewId) {
  return request("GET", `/hrms/performance/reviews/${reviewId}`);
}

// Analytics
export async function getLeaderboard(params = {}) {
  return request("GET", "/hrms/performance/leaderboard", null, params);
}

export async function getPerformanceAnalytics(params = {}) {
  return request("GET", "/hrms/performance/analytics", null, params);
}

// ── Leave Management APIs ─────────────────────────────────────────────────

// Configuration
export async function getLeaveConfig(params = {}) {
  return request("GET", "/hrms/leaves/configurations", null, params);
}

export async function addLeaveType(data, params = {}) {
  return request("POST", "/hrms/leaves/configurations/leave-types", data, params);
}

export async function updateLeaveType(leaveTypeId, data, params = {}) {
  return request("PUT", `/hrms/leaves/configurations/leave-types/${leaveTypeId}`, data, params);
}

export async function deleteLeaveType(leaveTypeId, params = {}) {
  return request("DELETE", `/hrms/leaves/configurations/leave-types/${leaveTypeId}`, null, params);
}

// Leave Requests
export async function applyLeave(data, params = {}) {
  return request("POST", "/hrms/leaves/apply", data, params);
}

export async function listLeaves(params = {}) {
  return request("GET", "/hrms/leaves/", null, params);
}

export async function getLeaveBalance(params = {}) {
  return request("GET", "/hrms/leaves/balance", null, params);
}

export async function getLeaveDetail(leaveId) {
  return request("GET", `/hrms/leaves/${leaveId}`);
}

export async function approveLeave(leaveId) {
  return request("PATCH", `/hrms/leaves/${leaveId}/approve`);
}

export async function rejectLeave(leaveId, reason) {
  return request("PATCH", `/hrms/leaves/${leaveId}/reject`, { reason });
}

export async function cancelLeave(leaveId) {
  return request("PATCH", `/hrms/leaves/${leaveId}/cancel`);
}

// ── Holiday Calendar APIs ─────────────────────────────────────────────────

export async function createHoliday(data, params = {}) {
  return request("POST", "/hrms/holidays/", data, params);
}

export async function listHolidays(params = {}) {
  return request("GET", "/hrms/holidays/", null, params);
}

export async function getHolidayDetail(holidayId) {
  return request("GET", `/hrms/holidays/${holidayId}`);
}

export async function updateHoliday(holidayId, data) {
  return request("PUT", `/hrms/holidays/${holidayId}`, data);
}

export async function deleteHoliday(holidayId) {
  return request("DELETE", `/hrms/holidays/${holidayId}`);
}

export async function importHolidaysCSV(file, params = {}) {
  const url = new URL("/api/proxy", window.location.origin);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") url.searchParams.set(key, val);
  });

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(url.toString(), {
    method: "POST",
    credentials: "include",
    headers: { "x-target-path": "/hrms/holidays/import" },
    body: formData,
  });

  let data;
  try { const text = await res.text(); data = JSON.parse(text); } catch { data = null; }
  return { ok: res.ok, status: res.status, data };
}

// ── Employee Edit Request APIs ────────────────────────────────────────────

export async function requestEditPermission(data) {
  return request("POST", "/hrms/employees/edit-requests/", data);
}

export async function listEditRequests(params = {}) {
  return request("GET", "/hrms/employees/edit-requests/", null, params);
}

export async function approveEditRequest(requestId, data = { hours: 3 }) {
  return request("PATCH", `/hrms/employees/edit-requests/${requestId}/approve`, data);
}

export async function rejectEditRequest(requestId, reason) {
  return request("PATCH", `/hrms/employees/edit-requests/${requestId}/reject`, { reason });
}

export async function saveEdit(requestId, data) {
  return request("PUT", `/hrms/employees/edit-requests/${requestId}/save`, data);
}

export async function checkEditPermission(section) {
  return request("GET", `/hrms/employees/edit-requests/can-edit/${section}`);
}

// ── Notification APIs ─────────────────────────────────────────────────────

export async function listNotifications(params = {}) {
  return request("GET", "/hrms/notifications/", null, params);
}

export async function getUnreadCount() {
  return request("GET", "/hrms/notifications/unread-count");
}

export async function markNotificationRead(notificationId) {
  return request("PUT", `/hrms/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead() {
  return request("PUT", "/hrms/notifications/read-all");
}

export async function deleteNotification(notificationId) {
  return request("DELETE", `/hrms/notifications/${notificationId}`);
}

export async function clearAllNotifications() {
  return request("DELETE", "/hrms/notifications/clear-all");
}

// ── Leave Balance Adjustment APIs ─────────────────────────────────────────

export async function adjustLeaveBalance(data, params = {}) {
  return request("POST", "/hrms/leaves/balance/adjust", data, params);
}

export async function getBalanceHistory(params = {}) {
  return request("GET", "/hrms/leaves/balance/history", null, params);
}

// ── Leave Forward & Comments ──────────────────────────────────────────────

export async function forwardLeave(leaveId, data) {
  return request("PATCH", `/hrms/leaves/${leaveId}/forward`, data);
}

export async function addLeaveComment(leaveId, comment) {
  return request("POST", `/hrms/leaves/${leaveId}/comments`, { comment });
}

// ── Leave Approval Workflow APIs ──────────────────────────────────────────

export async function getLeaveWorkflow(params = {}) {
  return request("GET", "/hrms/leaves/workflow", null, params);
}

export async function createLeaveWorkflow(data, params = {}) {
  return request("POST", "/hrms/leaves/workflow", data, params);
}

export async function updateLeaveWorkflow(workflowId, data) {
  return request("PUT", `/hrms/leaves/workflow/${workflowId}`, data);
}

export async function deleteLeaveWorkflow(workflowId) {
  return request("DELETE", `/hrms/leaves/workflow/${workflowId}`);
}

// ── Leave Reports APIs ────────────────────────────────────────────────────

export async function getUtilizationReport(params = {}) {
  return request("GET", "/hrms/leaves/reports/utilization", null, params);
}

export async function getBalanceReport(params = {}) {
  return request("GET", "/hrms/leaves/reports/balance", null, params);
}

export async function getMonthlyReport(params = {}) {
  return request("GET", "/hrms/leaves/reports/monthly", null, params);
}

export async function getDepartmentReport(params = {}) {
  return request("GET", "/hrms/leaves/reports/department", null, params);
}

export async function getLOPReport(params = {}) {
  return request("GET", "/hrms/leaves/reports/lop", null, params);
}

export async function getEmployeeLeaveHistory(params = {}) {
  return request("GET", "/hrms/leaves/reports/employee-history", null, params);
}

// ── Attendance APIs ───────────────────────────────────────────────────────

// Office Locations
export async function createOfficeLocation(data, params = {}) {
  return request("POST", "/hrms/attendance/locations", data, params);
}

export async function listOfficeLocations(params = {}) {
  return request("GET", "/hrms/attendance/locations", null, params);
}

export async function updateOfficeLocation(locationId, data) {
  return request("PUT", `/hrms/attendance/locations/${locationId}`, data);
}

export async function deleteOfficeLocation(locationId) {
  return request("DELETE", `/hrms/attendance/locations/${locationId}`);
}

// Check-in / Check-out
export async function attendanceCheckIn(data) {
  return request("POST", "/hrms/attendance/check-in", data);
}

export async function attendanceCheckOut(data) {
  return request("POST", "/hrms/attendance/check-out", data);
}

// Today's status
export async function getAttendanceToday(params = {}) {
  return request("GET", "/hrms/attendance/today", null, params);
}

// Employee history
export async function getMyAttendanceHistory(params = {}) {
  return request("GET", "/hrms/attendance/my-history", null, params);
}

// Regularization
export async function requestRegularization(data) {
  return request("POST", "/hrms/attendance/regularize", data);
}

export async function listRegularizations(params = {}) {
  return request("GET", "/hrms/attendance/regularizations", null, params);
}

export async function approveRegularization(regId) {
  return request("PATCH", `/hrms/attendance/regularizations/${regId}/approve`);
}

export async function rejectRegularization(regId, reason) {
  return request("PATCH", `/hrms/attendance/regularizations/${regId}/reject`, { reason });
}

// Attendance Records (HR)
export async function listAttendanceRecords(params = {}) {
  return request("GET", "/hrms/attendance/", null, params);
}

export async function getAttendanceSummary(params = {}) {
  return request("GET", "/hrms/attendance/summary", null, params);
}

export async function markAttendance(data) {
  return request("POST", "/hrms/attendance/mark", data);
}

export async function editAttendanceRecord(attendanceId, data) {
  return request("PUT", `/hrms/attendance/${attendanceId}`, data);
}

// Attendance Config
export async function getAttendanceConfig(params = {}) {
  return request("GET", "/hrms/attendance/config/", null, params);
}

export async function updateAttendanceConfig(data, params = {}) {
  return request("PUT", "/hrms/attendance/config/", data, params);
}

// Attendance Reports
export async function getDailyAttendanceReport(params = {}) {
  return request("GET", "/hrms/attendance/reports/daily", null, params);
}

export async function getMonthlyAttendanceReport(params = {}) {
  return request("GET", "/hrms/attendance/reports/monthly", null, params);
}

// ── Announcement APIs ─────────────────────────────────────────────────────

export async function createAnnouncement(data, params = {}) {
  return request("POST", "/hrms/announcements/", data, params);
}

export async function listAnnouncements(params = {}) {
  return request("GET", "/hrms/announcements/", null, params);
}

export async function getAnnouncementDetail(announcementId) {
  return request("GET", `/hrms/announcements/${announcementId}`);
}

export async function updateAnnouncement(announcementId, data) {
  return request("PUT", `/hrms/announcements/${announcementId}`, data);
}

export async function deleteAnnouncement(announcementId) {
  return request("DELETE", `/hrms/announcements/${announcementId}`);
}

export async function markAnnouncementRead(announcementId) {
  return request("PATCH", `/hrms/announcements/${announcementId}/read`);
}

export async function getUnreadAnnouncementsCount() {
  return request("GET", "/hrms/announcements/unread-count");
}

// ── Document APIs ─────────────────────────────────────────────────────────

// Company Documents
export async function uploadCompanyDocument(file, title, category, description, targetDepts, isMandatory, params = {}) {
  const url = new URL("/api/proxy", window.location.origin);
  Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  if (category) formData.append("category", category);
  if (description) formData.append("description", description);
  if (targetDepts && targetDepts.length > 0) formData.append("target_departments", JSON.stringify(targetDepts));
  if (isMandatory) formData.append("is_mandatory", "true");
  const res = await fetch(url.toString(), { method: "POST", credentials: "include", headers: { "x-target-path": "/hrms/documents/company" }, body: formData });
  let data; try { data = await res.json(); } catch { data = null; }
  return { ok: res.ok, status: res.status, data };
}

export async function listCompanyDocuments(params = {}) {
  return request("GET", "/hrms/documents/company", null, params);
}

export async function updateCompanyDocument(documentId, params = {}) {
  return request("PUT", `/hrms/documents/company/${documentId}`, null, params);
}

export async function deleteCompanyDocument(documentId) {
  return request("DELETE", `/hrms/documents/company/${documentId}`);
}

export async function acknowledgeDocument(documentId) {
  return request("PATCH", `/hrms/documents/company/${documentId}/acknowledge`);
}

// Employee Documents
export async function uploadEmployeeDocument(file, title, category, employeeId, params = {}) {
  const url = new URL("/api/proxy", window.location.origin);
  Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  if (category) formData.append("category", category);
  if (employeeId) formData.append("employee_id", employeeId);
  const res = await fetch(url.toString(), { method: "POST", credentials: "include", headers: { "x-target-path": "/hrms/documents/employee" }, body: formData });
  let data; try { data = await res.json(); } catch { data = null; }
  return { ok: res.ok, status: res.status, data };
}

export async function listEmployeeDocuments(params = {}) {
  return request("GET", "/hrms/documents/employee", null, params);
}

export async function deleteEmployeeDocument(documentId) {
  return request("DELETE", `/hrms/documents/employee/${documentId}`);
}

// Templates
export async function uploadTemplate(file, title, description, params = {}) {
  const url = new URL("/api/proxy", window.location.origin);
  Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  if (description) formData.append("description", description);
  const res = await fetch(url.toString(), { method: "POST", credentials: "include", headers: { "x-target-path": "/hrms/documents/templates" }, body: formData });
  let data; try { data = await res.json(); } catch { data = null; }
  return { ok: res.ok, status: res.status, data };
}

export async function listTemplates(params = {}) {
  return request("GET", "/hrms/documents/templates", null, params);
}

export async function deleteTemplate(templateId) {
  return request("DELETE", `/hrms/documents/templates/${templateId}`);
}


// ── Wellness & Mood APIs ──────────────────────────────────────────────────

export async function submitMood(data) {
  return request("POST", "/hrms/wellness/mood", data);
}

export async function getMoodHistory(days = 30) {
  return request("GET", "/hrms/wellness/mood/history", null, { days });
}

// HR view all employee mood entries — GET /hrms/wellness/mood/entries
export async function getMoodEntries(params = {}) {
  return request("GET", "/hrms/wellness/mood/entries", null, params);
}

export async function getWellnessDashboard(params = {}) {
  return request("GET", "/hrms/wellness/dashboard", null, params);
}

export async function getWellnessAnalytics(params = {}) {
  return request("GET", "/hrms/wellness/analytics", null, params);
}

export async function createWellnessProgram(data) {
  return request("POST", "/hrms/wellness/programs", data);
}

export async function listWellnessPrograms(params = {}) {
  return request("GET", "/hrms/wellness/programs", null, params);
}

export async function enrollInProgram(programId) {
  return request("POST", `/hrms/wellness/programs/${programId}/enroll`);
}

export async function unenrollFromProgram(programId) {
  return request("DELETE", `/hrms/wellness/programs/${programId}/enroll`);
}


// ── Document Requests APIs ────────────────────────────────────────────────

export async function requestDocument(params) {
  return request("POST", "/hrms/documents/requests", null, params);
}

export async function listDocumentRequests(params = {}) {
  return request("GET", "/hrms/documents/requests", null, params);
}

export async function uploadRequestedDocument(requestId, file) {
  const url = new URL("/api/proxy", window.location.origin);
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(url.toString(), {
    method: "PUT",
    headers: { "x-target-path": `/hrms/documents/requests/${requestId}/upload` },
    body: formData,
  });
  let data; try { const t = await res.text(); data = JSON.parse(t); } catch { data = null; }
  return { ok: res.ok, status: res.status, data };
}

export async function reviewDocumentRequest(requestId, action, reason = "") {
  return request("PATCH", `/hrms/documents/requests/${requestId}/review`, null, { action, reason });
}


export async function getDefaultDocumentTitles() {
  return request("GET", "/hrms/documents/default-titles");
}


// ── Department APIs ───────────────────────────────────────────────────────

export async function createDepartment(data) {
  return request("POST", "/hrms/departments/", data);
}

export async function listDepartments(params = {}) {
  return request("GET", "/hrms/departments/", null, params);
}

export async function getDepartmentDetail(departmentId) {
  return request("GET", `/hrms/departments/${departmentId}`);
}

export async function updateDepartment(departmentId, data) {
  return request("PUT", `/hrms/departments/${departmentId}`, data);
}

export async function deleteDepartment(departmentId) {
  return request("DELETE", `/hrms/departments/${departmentId}`);
}


export async function importDepartmentsCSV(file) {
  const url = new URL("/api/proxy", window.location.origin);
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "x-target-path": "/hrms/departments/import" },
    body: formData,
  });
  let data; try { const t = await res.text(); data = JSON.parse(t); } catch { data = null; }
  return { ok: res.ok, status: res.status, data };
}



// ── Activity Log APIs ─────────────────────────────────────────────────────

export async function getActivityLogs(params = {}) {
  return request("GET", "/hrms/activity-logs/", null, params);
}

export async function getActivityLogStats() {
  return request("GET", "/hrms/activity-logs/stats");
}


// ── Auth Profile APIs ─────────────────────────────────────────────────────

export async function updateProfile(data) {
  return request("PUT", "/hrms/auth/profile", data);
}

export async function changePassword(data) {
  return request("POST", "/hrms/auth/change-password", data);
}


// ── Payroll APIs ──────────────────────────────────────────────────────────

export async function getPayrollConfig(params = {}) {
  return request("GET", "/hrms/payroll/settings", null, params);
}

export async function updatePayrollConfig(data, params = {}) {
  return request("PUT", "/hrms/payroll/settings", data, params);
}

export async function runPayroll(data, params = {}) {
  return request("POST", "/hrms/payroll/run", data, params);
}

export async function listPayrollRuns(params = {}) {
  return request("GET", "/hrms/payroll/runs", null, params);
}

export async function getPayrollRunDetail(runId) {
  return request("GET", `/hrms/payroll/runs/${runId}`);
}

export async function approvePayrollRun(runId) {
  return request("PATCH", `/hrms/payroll/runs/${runId}/approve`);
}

export async function markPayrollPaid(runId) {
  return request("PATCH", `/hrms/payroll/runs/${runId}/mark-paid`);
}

export async function listPayslips(params = {}) {
  return request("GET", "/hrms/payroll/payslips", null, params);
}

export async function getMyPayslips(params = {}) {
  return request("GET", "/hrms/payroll/payslips/me", null, params);
}

export async function getPayslipDetail(payslipId) {
  return request("GET", `/hrms/payroll/payslips/${payslipId}`);
}

export async function editPayslip(payslipId, data) {
  return request("PUT", `/hrms/payroll/payslips/${payslipId}`, data);
}

export async function addPayrollAdjustment(data, params = {}) {
  return request("POST", "/hrms/payroll/adjustments", data, params);
}

export async function listPayrollAdjustments(params = {}) {
  return request("GET", "/hrms/payroll/adjustments", null, params);
}

export async function getPayrollSummary(params = {}) {
  return request("GET", "/hrms/payroll/reports/summary", null, params);
}

export async function getAnnualStatement(params = {}) {
  return request("GET", "/hrms/payroll/reports/annual", null, params);
}

export async function getBankTransferReport(params = {}) {
  return request("GET", "/hrms/payroll/reports/bank-transfer", null, params);
}

export async function getSalaryRegisterReport(params = {}) {
  return request("GET", "/hrms/payroll/reports/salary-register", null, params);
}

export async function getDepartmentPayrollReport(params = {}) {
  return request("GET", "/hrms/payroll/reports/department", null, params);
}


// ── Talent Finder APIs ────────────────────────────────────────────────────

// POST /hrms/talent-finder/search — multipart/form-data
export async function runTalentSearch({ jdFile, title, department, employeeIds, topN }) {
  const url = new URL("/api/proxy", window.location.origin);
  const formData = new FormData();
  formData.append("jd_file", jdFile);
  if (title)       formData.append("title",        title);
  if (department)  formData.append("department",   department);
  if (employeeIds) formData.append("employee_ids", employeeIds); // comma-separated
  if (topN)        formData.append("top_n",        String(topN));

  const res = await fetch(url.toString(), {
    method: "POST",
    credentials: "include",
    headers: { "x-target-path": "/hrms/talent-finder/search" },
    body: formData,
  });
  let data; try { const t = await res.text(); data = JSON.parse(t); } catch { data = null; }
  return { ok: res.ok, status: res.status, data };
}

// GET /hrms/talent-finder/history
export async function getTalentSearchHistory(params = {}) {
  return request("GET", "/hrms/talent-finder/history", null, params);
}

// GET /hrms/talent-finder/history/{search_id}
export async function getTalentSearchDetail(searchId) {
  return request("GET", `/hrms/talent-finder/history/${searchId}`);
}


// ── Work Management APIs ──────────────────────────────────────────────────

// Projects
export async function createProject(data) {
  return request("POST", "/hrms/work/projects", data);
}

export async function listProjects(params = {}) {
  return request("GET", "/hrms/work/projects", null, params);
}

export async function updateProject(projectId, data) {
  return request("PUT", `/hrms/work/projects/${projectId}`, data);
}

export async function archiveProject(projectId) {
  return request("DELETE", `/hrms/work/projects/${projectId}`);
}

export async function addProjectMember(projectId, employeeId) {
  return request("POST", `/hrms/work/projects/${projectId}/members`, { employee_id: employeeId });
}

export async function removeProjectMember(projectId, employeeId) {
  return request("DELETE", `/hrms/work/projects/${projectId}/members/${employeeId}`);
}

// Work Items
export async function createWorkItem(data) {
  return request("POST", "/hrms/work/work-items", data);
}

export async function listWorkItems(params = {}) {
  return request("GET", "/hrms/work/work-items", null, params);
}

export async function getWorkItemDetail(itemId) {
  return request("GET", `/hrms/work/work-items/${itemId}`);
}

export async function updateWorkItem(itemId, data) {
  // Status changes must go through PATCH /status endpoint only
  const { status, ...safeData } = data;
  return request("PUT", `/hrms/work/work-items/${itemId}`, safeData);
}

export async function deleteWorkItem(itemId) {
  return request("DELETE", `/hrms/work/work-items/${itemId}`);
}

export async function changeWorkItemStatus(itemId, status) {
  return request("PATCH", `/hrms/work/work-items/${itemId}/status`, { status });
}

export async function assignWorkItem(itemId, employeeId) {
  return request("PATCH", `/hrms/work/work-items/${itemId}/assign`, { employee_id: employeeId });
}

export async function addWorkItemComment(itemId, text, attachment) {
  const body = { text };
  if (attachment) body.attachment = attachment;
  return request("POST", `/hrms/work/work-items/${itemId}/comments`, body);
}

export async function addWorkItemAttachment(itemId, data) {
  return request("POST", `/hrms/work/work-items/${itemId}/attachments`, data);
}

// Timesheets
export async function createTimesheet(data) {
  return request("POST", "/hrms/work/timesheets", data);
}

export async function getMyTimesheets(params = {}) {
  return request("GET", "/hrms/work/timesheets/me", null, params);
}

export async function getTeamTimesheets(params = {}) {
  return request("GET", "/hrms/work/timesheets/team", null, params);
}

export async function approveTimesheet(timesheetId, action) {
  return request("PATCH", `/hrms/work/timesheets/${timesheetId}/approve`, { action });
}

// Daily Updates
export async function submitDailyUpdate(data) {
  return request("POST", "/hrms/work/daily-updates", data);
}

export async function getMyDailyUpdates(params = {}) {
  return request("GET", "/hrms/work/daily-updates/me", null, params);
}

export async function getTeamDailyUpdates(params = {}) {
  return request("GET", "/hrms/work/daily-updates/team", null, params);
}


// GET /hrms/work/projects/{project_id}/members
export async function getProjectMembers(projectId) {
  return request("GET", `/hrms/work/projects/${projectId}/members`);
}


// Work Items — extended endpoints
export async function changeWorkItemStatusExtended(itemId, status, blockedReason, comment) {
  const body = { status };
  if (blockedReason) body.blocked_reason = blockedReason;
  if (comment) body.comment = comment;
  return request("PATCH", `/hrms/work/work-items/${itemId}/status`, body);
}

export async function logWorkItemHours(itemId, hours, description) {
  return request("POST", `/hrms/work/work-items/${itemId}/log-hours`, { hours, description: description || undefined });
}

export async function getWorkItemActivity(itemId) {
  return request("GET", `/hrms/work/work-items/${itemId}/activity`);
}


// GET /hrms/work/work-items/{item_id}/attachments
export async function getWorkItemAttachments(itemId) {
  return request("GET", `/hrms/work/work-items/${itemId}/attachments`);
}


// GET /hrms/work/work-items/overdue
export async function getOverdueWorkItems(params = {}) {
  return request("GET", "/hrms/work/work-items/overdue", null, params);
}


// PATCH /hrms/work/timesheets/bulk-approve
export async function bulkApproveTimesheets(timesheetIds, action = "approved") {
  return request("PATCH", "/hrms/work/timesheets/bulk-approve", { timesheet_ids: timesheetIds, action });
}


// Analytics Dashboard — single aggregated endpoint
export async function getAnalyticsDashboard(params = {}) {
  return request("GET", "/hrms/analytics/dashboard", null, params);
}


// AI Insights — rules-based
export async function getAIInsights(params = {}) {
  return request("GET", "/hrms/ai-insights/", null, params);
}


// ── Role-Based Dashboard API ──────────────────────────────────────────────

export async function getDashboard() {
  return request("GET", "/hrms/dashboard/");
}


// ── Organization Logo Upload ──────────────────────────────────────────────

export async function uploadOrgLogo(file, organizationId = null) {
  const url = new URL("/api/proxy", window.location.origin);
  if (organizationId) url.searchParams.set("organization_id", organizationId);

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(url.toString(), {
    method: "POST",
    credentials: "include",
    headers: { "x-target-path": "/hrms/organizations/me/logo" },
    body: formData,
  });

  let data;
  try { const text = await res.text(); data = JSON.parse(text); } catch { data = null; }
  return { ok: res.ok, status: res.status, data };
}


// ── Asset Management APIs ─────────────────────────────────────────────────

export async function listAssets(params = {}) {
  return request("GET", "/hrms/assets/", null, params);
}

export async function createAsset(data) {
  return request("POST", "/hrms/assets/", data);
}

export async function getAssetDetail(assetId) {
  return request("GET", `/hrms/assets/${assetId}`);
}

export async function updateAsset(assetId, data) {
  return request("PUT", `/hrms/assets/${assetId}`, data);
}

export async function retireAsset(assetId) {
  return request("DELETE", `/hrms/assets/${assetId}`);
}

export async function assignAsset(assetId, data) {
  return request("POST", `/hrms/assets/${assetId}/assign`, data);
}

export async function returnAsset(assetId, data) {
  return request("POST", `/hrms/assets/${assetId}/return`, data);
}

export async function getMyAssets() {
  return request("GET", "/hrms/assets/my");
}

export async function requestAssetReturn(assetId) {
  return request("POST", `/hrms/assets/${assetId}/request-return`);
}

export async function getAssetCategories() {
  return request("GET", "/hrms/assets/categories");
}

export async function createAssetCategory(data) {
  return request("POST", "/hrms/assets/categories", data);
}

export async function getAssetSummary() {
  return request("GET", "/hrms/assets/reports/summary");
}


export async function updateAssetCategory(categoryId, data) {
  return request("PUT", `/hrms/assets/categories/${categoryId}`, data);
}

export async function deleteAssetCategory(categoryId) {
  return request("DELETE", `/hrms/assets/categories/${categoryId}`);
}


// ── Exit Management APIs ──────────────────────────────────────────────────

export async function submitResignation(data) {
  return request("POST", "/hrms/exit/resign", data);
}

export async function listExitRequests(params = {}) {
  return request("GET", "/hrms/exit/", null, params);
}

export async function getMyExitStatus() {
  return request("GET", "/hrms/exit/my");
}

export async function getExitDetail(exitId) {
  return request("GET", `/hrms/exit/${exitId}`);
}

export async function approveResignation(exitId, data) {
  return request("PATCH", `/hrms/exit/${exitId}/approve`, data);
}

export async function rejectResignation(exitId, data) {
  return request("PATCH", `/hrms/exit/${exitId}/reject`, data);
}

export async function updateClearance(exitId, data) {
  return request("PUT", `/hrms/exit/${exitId}/clearance`, data);
}

export async function completeExit(exitId) {
  return request("PATCH", `/hrms/exit/${exitId}/complete`);
}

export async function saveExitInterview(exitId, data) {
  return request("POST", `/hrms/exit/${exitId}/interview`, data);
}

export async function getExitSettlement(exitId) {
  return request("GET", `/hrms/exit/${exitId}/settlement`);
}

export async function getExitReportSummary() {
  return request("GET", "/hrms/exit/reports/summary");
}
