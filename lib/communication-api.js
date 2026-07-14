// ============================================
// Communication Module — API Helper
// ============================================

const PROXY_URL = "/api/proxy";

async function request(method, path, body = null, params = {}) {
  const url = new URL(PROXY_URL, window.location.origin);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") url.searchParams.set(key, val);
  });
  const headers = { "x-target-path": path, "Content-Type": "application/json" };
  const options = { method, headers, credentials: "include" };
  if (body && method !== "GET") options.body = JSON.stringify(body);

  let res = await fetch(url.toString(), options);
  if (res.status === 401) {
    const refreshRes = await fetch(new URL(PROXY_URL, window.location.origin).toString(), {
      method: "POST", credentials: "include",
      headers: { "x-target-path": "/hrms/auth/refresh", "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (refreshRes.ok) res = await fetch(url.toString(), options);
    else return { ok: false, status: 401, data: { detail: "Session expired" } };
  }
  let data;
  try { const text = await res.text(); data = JSON.parse(text); } catch { data = null; }
  return { ok: res.ok, status: res.status, data };
}

// ── Templates ─────────────────────────────────────────────────────────────
export async function listEmailTemplates(params = {}) {
  return request("GET", "/hrms/communication/templates", null, params);
}
export async function createEmailTemplate(data) {
  return request("POST", "/hrms/communication/templates", data);
}
export async function updateEmailTemplate(id, data) {
  return request("PUT", `/hrms/communication/templates/${id}`, data);
}
export async function deleteEmailTemplate(id) {
  return request("DELETE", `/hrms/communication/templates/${id}`);
}

// ── Send Email ────────────────────────────────────────────────────────────
export async function sendEmail(data) {
  return request("POST", "/hrms/communication/send", data);
}

// ── Campaigns ─────────────────────────────────────────────────────────────
export async function listCampaigns(params = {}) {
  return request("GET", "/hrms/communication/campaigns", null, params);
}
export async function createCampaign(data) {
  return request("POST", "/hrms/communication/campaigns", data);
}
export async function sendCampaign(id) {
  return request("POST", `/hrms/communication/campaigns/${id}/send`);
}

// ── Logs ──────────────────────────────────────────────────────────────────
export async function listEmailLogs(params = {}) {
  return request("GET", "/hrms/communication/logs", null, params);
}

// ── Stats ─────────────────────────────────────────────────────────────────
export async function getCommStats() {
  return request("GET", "/hrms/communication/stats");
}

// ── Settings ──────────────────────────────────────────────────────────────
export async function getEmailSettings() {
  return request("GET", "/hrms/communication/settings");
}
export async function updateEmailSettings(data) {
  return request("PUT", "/hrms/communication/settings", data);
}
export async function testEmailConnection() {
  return request("POST", "/hrms/communication/settings/test");
}

// ── AI Generation ─────────────────────────────────────────────────────────
export async function generateAITemplate(data) {
  return request("POST", "/hrms/communication/ai/generate", data);
}
