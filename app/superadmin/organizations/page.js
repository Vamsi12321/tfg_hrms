"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Plus, Search, Filter, Globe, Mail,
  Edit2, Ban, CheckCircle2, X, Users, Loader2,
  RefreshCw, AlertCircle, Trash2, MapPin, Phone
} from "lucide-react";
import TopBar from "@/components/TopBar";

const VALID_INDUSTRIES = [
  "Information Technology",
  "Healthcare",
  "Finance & Banking",
  "Education",
  "Manufacturing",
  "Retail & E-commerce",
  "Telecommunications",
  "Real Estate",
  "Hospitality & Tourism",
  "Transportation & Logistics",
  "Media & Entertainment",
  "Energy & Utilities",
  "Agriculture",
  "Construction",
  "Pharmaceuticals",
  "Automotive",
  "Consulting",
  "Insurance",
  "Legal Services"
];

// ─── Proxy helper ──────────────────────────────────────────────────────────────
async function proxyFetch(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options;
  return fetch("/api/proxy", {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      "x-target-path": path,
      ...extraHeaders,
    },
    credentials: "include",
  });
}

// ─── Map backend org → UI shape ────────────────────────────────────────────────
function mapOrg(b) {
  const limit = b.emp_count_for_access || 0;
  let plan = "Starter";
  if (limit > 100) plan = "Enterprise";
  else if (limit > 20) plan = "Business";

  const revenue = plan === "Enterprise" ? 49900 : plan === "Business" ? 19900 : 4900;

  return {
    id: b.id,
    name: b.org_name || "Unnamed Org",
    email: b.email || "",
    domain: b.email ? b.email.split("@")[1] || b.email : "—",
    plan,
    monthlyRevenue: revenue,
    status: b.status === "inactive" || b.is_deleted ? "suspended" : "active",
    employeeCount: limit,
    adminName: b.admin_name || "—",
    adminEmail: b.admin_email || "—",
    adminPhone: b.admin_phone || "—",
    orgAddress: b.org_address || "—",
    industry: b.industry || "—",
    country: b.country || "—",
    state: b.state || "—",
    createdAt: b.created_at ? b.created_at.split("T")[0] : "—",
    isDeleted: !!b.is_deleted,
  };
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ msg: "", type: "success" });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);

  // Form fields (matching exact API schema)
  const [orgName, setOrgName] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [empCount, setEmpCount] = useState("10");
  const [statusField, setStatusField] = useState("active");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 4500);
  };

  // ── Load organizations ────────────────────────────────────────────────────
  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await proxyFetch("/hrms/organizations/?page=1&limit=100");
      if (res.ok) {
        const data = await res.json();
        const list = data.organizations || (Array.isArray(data) ? data : data.data || data.items || []);
        setOrgs(list.map(mapOrg));
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.detail || "Failed to load organizations.");
      }
    } catch (e) {
      setError("Network error. Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // ── Reset form ────────────────────────────────────────────────────────────
  const resetForm = (org = null) => {
    setOrgName(org?.name || "");
    setOrgEmail(org?.email || "");
    setAdminName(org?.adminName === "—" ? "" : org?.adminName || "");
    setAdminEmail(org?.adminEmail === "—" ? "" : org?.adminEmail || "");
    setAdminPhone(org?.adminPhone === "—" ? "" : org?.adminPhone || "");
    setIndustry(org?.industry === "—" ? "Information Technology" : org?.industry || "Information Technology");
    setCountry(org?.country === "—" ? "" : org?.country || "");
    setState(org?.state === "—" ? "" : org?.state || "");
    setOrgAddress(org?.orgAddress === "—" ? "" : org?.orgAddress || "");
    setEmpCount(org?.employeeCount?.toString() || "10");
    setStatusField(org?.status || "active");
  };

  const handleOpenAdd = () => {
    setEditingOrg(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (org) => {
    setEditingOrg(org);
    resetForm(org);
    setIsModalOpen(true);
  };

  // ── Save (create or update) ────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingOrg) {
        // ── PUT /hrms/organizations/{org_id} ────────────────────────────
        const payload = {
          org_name: orgName,
          email: orgEmail,
          emp_count_for_access: parseInt(empCount) || 10,
          industry: VALID_INDUSTRIES.includes(industry) ? industry : "Other",
          country,
          state,
          org_address: orgAddress,
          admin_name: adminName,
          admin_email: adminEmail,
          admin_phone: adminPhone,
          status: statusField === "active" ? "active" : "inactive",
        };

        const res = await proxyFetch(`/hrms/organizations/${editingOrg.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const updated = await res.json();
          setOrgs((prev) =>
            prev.map((o) => (o.id === editingOrg.id ? mapOrg(updated) : o))
          );
          setIsModalOpen(false);
          showToast(`"${orgName}" updated successfully.`);
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(err.detail || err.message || "Failed to update organization.", "error");
        }
      } else {
        // ── POST /hrms/organizations/ ───────────────────────────────────
        const payload = {
          org_name: orgName,
          email: orgEmail,
          admin_name: adminName,
          admin_email: adminEmail,
          admin_phone: adminPhone,
          emp_count_for_access: parseInt(empCount) || 10,
          industry: VALID_INDUSTRIES.includes(industry) ? industry : "Other",
          country,
          state,
          org_address: orgAddress,
        };

        const res = await proxyFetch("/hrms/organizations/", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const created = await res.json();
          setOrgs((prev) => [...prev, mapOrg(created)]);
          setIsModalOpen(false);
          const tempPwd = created.temp_admin_password || "Welcome1";
          showToast(`"${orgName}" created! Admin Password: "${tempPwd}" (Sent to ${adminEmail})`);
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(err.detail || err.message || "Failed to create organization.", "error");
        }
      }
    } catch (e) {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle status (PUT with status field) ─────────────────────────────────
  const handleToggleStatus = async (id, currentStatus) => {
    const nextApiStatus = currentStatus === "active" ? "inactive" : "active";
    const nextUiStatus = currentStatus === "active" ? "suspended" : "active";

    try {
      const res = await proxyFetch(`/hrms/organizations/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: nextApiStatus }),
      });

      if (res.ok) {
        setOrgs((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: nextUiStatus } : o))
        );
        showToast(`Organization ${nextUiStatus === "active" ? "activated" : "suspended"}.`);
      } else {
        showToast("Failed to update status.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  // ── Soft delete ──────────────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!confirm(`Soft-delete "${name}"? The organization will be deactivated but data will be retained.`)) return;
    try {
      const res = await proxyFetch(`/hrms/organizations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setOrgs((prev) => prev.filter((o) => o.id !== id));
        showToast(`"${name}" has been soft-deleted.`);
      } else {
        showToast("Failed to delete organization.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredOrgs = orgs.filter((org) => {
    const q = search.toLowerCase();
    const matchesSearch =
      org.name.toLowerCase().includes(q) ||
      org.email.toLowerCase().includes(q) ||
      org.adminName.toLowerCase().includes(q) ||
      org.adminEmail.toLowerCase().includes(q) ||
      org.industry.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || org.status === statusFilter;
    const matchesPlan = planFilter === "all" || org.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusBadge = (status) => {
    if (status === "active")
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Suspended
      </span>
    );
  };

  const stats = {
    total: orgs.length,
    active: orgs.filter((o) => o.status === "active").length,
    enterprise: orgs.filter((o) => o.plan === "Enterprise").length,
    employees: orgs.reduce((acc, o) => acc + (o.employeeCount || 0), 0),
  };

  const isIndustryStandard = VALID_INDUSTRIES.includes(industry);
  const selectValue = isIndustryStandard ? industry : (industry ? "Other" : "Information Technology");

  const handleIndustrySelectChange = (e) => {
    const val = e.target.value;
    if (val === "Other") {
      setIndustry("Other");
    } else {
      setIndustry(val);
    }
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Organization Directory" />

      <div className="p-6 space-y-6">

        {/* Toast Notification */}
        <AnimatePresence>
          {toast.msg && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 border ${
                toast.type === "error"
                  ? "bg-rose-600 border-rose-700"
                  : "bg-slate-900 border-slate-800"
              }`}
            >
              {toast.type === "error" ? (
                <AlertCircle className="w-4 h-4 text-rose-200" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>{toast.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Manage Tenant Organizations</h2>
            <p className="text-xs text-slate-500">Configure corporate tenants, monitor billing plans, status, and system size.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadOrganizations}
              disabled={loading}
              title="Refresh"
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" /> Add Organization
            </motion.button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex gap-3 text-rose-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-medium">{error}</span>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Organizations", value: loading ? "…" : stats.total, sub: "All tenants" },
            { label: "Active Tenants", value: loading ? "…" : stats.active, sub: "Currently operational" },
            { label: "Enterprise Clients", value: loading ? "…" : stats.enterprise, sub: ">100 employee limit" },
            { label: "Total Employees", value: loading ? "…" : stats.employees.toLocaleString(), sub: "Across all tenants" },
          ].map((s, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{s.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, admin, industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600">Filters:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 transition-colors"
            >
              <option value="all">All Plans</option>
              <option value="Starter">Starter</option>
              <option value="Business">Business</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        {/* Organizations Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Organization</th>
                  <th className="px-6 py-4">Contact Email</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Employees</th>
                  <th className="px-6 py-4">Administrator</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                        <span className="text-sm font-medium">Loading organizations from server…</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrgs.length > 0 ? (
                  filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{org.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{org.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {org.email || org.domain}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className={`inline-block text-xs font-extrabold px-2 py-0.5 rounded-md ${
                            org.plan === "Enterprise"
                              ? "bg-purple-50 text-purple-700 border border-purple-100"
                              : org.plan === "Business"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "bg-green-50 text-green-700 border border-green-100"
                          }`}>
                            {org.plan}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">₹{org.monthlyRevenue.toLocaleString()}/mo</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(org.status)}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {org.employeeCount}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 text-xs">{org.adminName}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {org.adminEmail}
                        </p>
                        {org.adminPhone !== "—" && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {org.adminPhone}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{[org.state, org.country].filter((v) => v && v !== "—").join(", ") || "—"}</span>
                        </div>
                        {org.industry !== "—" && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{org.industry}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">{org.createdAt}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(org)}
                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit Organization"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(org.id, org.status)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              org.status === "active"
                                ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                                : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                            }`}
                            title={org.status === "active" ? "Suspend Organization" : "Activate Organization"}
                          >
                            {org.status === "active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete(org.id, org.name)}
                            className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors"
                            title="Soft Delete Organization"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-16 text-center text-slate-400 font-medium">
                      {error ? "Could not load data." : "No organizations match the current filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add / Edit Organization Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
                  <h3 className="font-bold text-slate-900">
                    {editingOrg ? `Edit — ${editingOrg.name}` : "Add New Organization"}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">

                  {/* Organization Details */}
                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-3">Organization Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Organization Name *</label>
                        <input
                          type="text"
                          required
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          placeholder="e.g. Tech Solutions Inc"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Organization Email *</label>
                        <input
                          type="email"
                          required
                          value={orgEmail}
                          onChange={(e) => setOrgEmail(e.target.value)}
                          placeholder="e.g. contact@techsolutions.com"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Industry *</label>
                        <select
                          required
                          value={selectValue}
                          onChange={handleIndustrySelectChange}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 bg-white transition-colors cursor-pointer"
                        >
                          <option value="Information Technology">Information Technology</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Finance & Banking">Finance & Banking</option>
                          <option value="Education">Education</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Retail & E-commerce">Retail & E-commerce</option>
                          <option value="Telecommunications">Telecommunications</option>
                          <option value="Real Estate">Real Estate</option>
                          <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                          <option value="Transportation & Logistics">Transportation & Logistics</option>
                          <option value="Media & Entertainment">Media & Entertainment</option>
                          <option value="Energy & Utilities">Energy & Utilities</option>
                          <option value="Agriculture">Agriculture</option>
                          <option value="Construction">Construction</option>
                          <option value="Pharmaceuticals">Pharmaceuticals</option>
                          <option value="Automotive">Automotive</option>
                          <option value="Consulting">Consulting</option>
                          <option value="Insurance">Insurance</option>
                          <option value="Legal Services">Legal Services</option>
                          <option value="Other">Other</option>
                        </select>

                        {!isIndustryStandard && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-2"
                          >
                            <label className="text-[10px] font-bold text-slate-500 mb-1 block">Specify Custom Industry *</label>
                            <input
                              type="text"
                              required
                              value={industry === "Other" ? "" : industry}
                              onChange={(e) => setIndustry(e.target.value || "Other")}
                              placeholder="e.g. Software, Aviation"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                            />
                          </motion.div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Employee Limit *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={empCount}
                          onChange={(e) => setEmpCount(e.target.value)}
                          placeholder="e.g. 100"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Country</label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="e.g. India"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">State</label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="e.g. Karnataka"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Office Address</label>
                        <input
                          type="text"
                          value={orgAddress}
                          onChange={(e) => setOrgAddress(e.target.value)}
                          placeholder="e.g. 123 Tech Street, Bangalore"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                      {editingOrg && (
                        <div>
                          <label className="text-xs font-bold text-slate-600 mb-1 block">Status</label>
                          <select
                            value={statusField}
                            onChange={(e) => setStatusField(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 bg-white transition-colors"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Administrator Details */}
                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-3">Primary Administrator</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Admin Name *</label>
                        <input
                          type="text"
                          required
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          placeholder="e.g. John Admin"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Admin Email *</label>
                        <input
                          type="email"
                          required
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="e.g. admin@techsolutions.com"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Admin Phone *</label>
                        <input
                          type="tel"
                          required
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                    </div>
                    {!editingOrg && (
                      <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
                        ⚠️ A secure temporary password will be auto-generated and sent to the admin email after creation.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 transition-all disabled:opacity-60"
                    >
                      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {editingOrg ? "Save Changes" : "Create Organization"}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
