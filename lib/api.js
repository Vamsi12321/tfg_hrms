// ============================================
// TFG HRMS - API Helper
// ============================================

// All API calls go through the proxy route to handle cookies/auth
const PROXY_URL = "/api/proxy";

async function request(method, path, body = null, params = {}) {
  const url = new URL(PROXY_URL, window.location.origin);

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

  const res = await fetch(url.toString(), options);

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

export async function listOrganizations({ page = 1, limit = 100 } = {}) {
  return request("GET", "/hrms/organizations/", null, { page, limit });
}

// ── Employee APIs ─────────────────────────────────────────────────────────

export async function createEmployee(data) {
  return request("POST", "/hrms/employees/", data);
}

export async function listEmployees({ page = 1, limit = 10, status, department, search, include_deleted = false, organization_id } = {}) {
  return request("GET", "/hrms/employees/", null, { page, limit, status, department, search, include_deleted, organization_id });
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
