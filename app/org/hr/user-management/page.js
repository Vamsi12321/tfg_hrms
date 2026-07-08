"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Search, X, Mail, Phone, Shield,
  CheckCircle2, XCircle, Edit, Trash2, AlertCircle,
  RefreshCw, ChevronLeft, ChevronRight, UserPlus,
  Building, Check, X as XIcon, Settings
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";
import {
  createAdminUser, listAdminUsers, updateAdminUser, deactivateAdminUser
} from "@/lib/api";

const roleConfig = {
  org_admin: { label: "Org Admin", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200/50", dot: "bg-indigo-500", icon: Building },
  hr_admin:  { label: "HR Admin",  bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200/50", dot: "bg-blue-500", icon: Users },
  superadmin:{ label: "Superadmin",bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200/50", dot: "bg-purple-500", icon: Shield },
};

export default function UserManagementPage() {
  const { user } = useAuth();

  // State
  const [users, setUsers]               = useState([]);
  const [totalUsers, setTotalUsers]     = useState(0);
  const [totalPages, setTotalPages]     = useState(1);
  const [page, setPage]                 = useState(1);
  const [limit]                         = useState(10);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [toast, setToast]               = useState(null);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(null);
  const [formLoading, setFormLoading]   = useState(false);
  const [error, setError]               = useState("");

  // Create form
  const [createForm, setCreateForm] = useState({
    email: "", full_name: "", phone: "", role: "hr_admin", organization_id: ""
  });

  // Edit form
  const [editForm, setEditForm] = useState({ email: "", full_name: "", phone: "" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminUsers({ page, limit, include_inactive: includeInactive });
      if (res.ok && res.data) {
        setUsers(res.data.users || []);
        setTotalUsers(res.data.total || 0);
        setTotalPages(res.data.pages || 1);
      } else {
        showToast(res.data?.error || "Failed to fetch users", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, includeInactive]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Create user
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    const payload = {
      email: createForm.email,
      full_name: createForm.full_name,
      phone: createForm.phone,
      role: createForm.role,
    };
    if (createForm.role === "org_admin" && createForm.organization_id) {
      payload.organization_id = createForm.organization_id;
    }

    try {
      const res = await createAdminUser(payload);
      if (res.ok) {
        showToast(`${createForm.full_name} created successfully. Invitation email sent.`);
        setShowCreateModal(false);
        setCreateForm({ email: "", full_name: "", phone: "", role: "hr_admin", organization_id: "" });
        fetchUsers();
      } else {
        setError(res.data?.detail?.[0]?.msg || res.data?.error || "Failed to create user");
      }
    } catch {
      setError("Network error");
    } finally {
      setFormLoading(false);
    }
  };

  // Update user
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!showEditModal) return;
    setFormLoading(true);
    setError("");

    const updates = {};
    if (editForm.full_name) updates.full_name = editForm.full_name;
    if (editForm.email) updates.email = editForm.email;
    if (editForm.phone) updates.phone = editForm.phone;

    try {
      const res = await updateAdminUser(showEditModal._id || showEditModal.id, updates);
      if (res.ok) {
        showToast("User updated successfully");
        setShowEditModal(null);
        fetchUsers();
      } else {
        setError(res.data?.detail?.[0]?.msg || res.data?.error || "Failed to update");
      }
    } catch {
      setError("Network error");
    } finally {
      setFormLoading(false);
    }
  };

  // Deactivate user
  const handleDeactivate = async () => {
    if (!showDeactivateModal) return;
    setFormLoading(true);
    try {
      const res = await deactivateAdminUser(showDeactivateModal._id || showDeactivateModal.id);
      if (res.ok) {
        showToast(`${showDeactivateModal.full_name} deactivated`);
        setShowDeactivateModal(null);
        fetchUsers();
      } else {
        showToast(res.data?.error || "Failed to deactivate", "error");
        setShowDeactivateModal(null);
      }
    } catch {
      showToast("Network error", "error");
      setShowDeactivateModal(null);
    } finally {
      setFormLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const isSuperAdmin = user?.role === "superadmin" || user?.role === "admin";

  const activeCount = users.filter(u => u.is_active !== false).length;
  const adminCount = users.filter(u => u.role === "org_admin").length;
  const hrCount = users.filter(u => u.role === "hr_admin").length;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="User Management" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-emerald-500"}`}>
            {toast.type==="error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-5">
        
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Admin Users</h2>
            <p className="text-sm text-slate-500">
              {isSuperAdmin ? "Manage org admins and HR admins" : "Manage HR admin users in your organization"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchUsers} title="Refresh Data"
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
              <RefreshCw className={`w-4 h-4 text-slate-500 ${loading?"animate-spin":""}`} />
            </button>
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 transition-shadow">
              <UserPlus className="w-4 h-4" /> Create Admin
            </motion.button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: totalUsers, color: "text-indigo-700", bg: "bg-indigo-50/60", border: "border-indigo-100/40", dot: "bg-indigo-500" },
            { label: "Active Users", value: activeCount, color: "text-emerald-700", bg: "bg-emerald-50/60", border: "border-emerald-100/40", dot: "bg-emerald-500" },
            { label: "Org Admins", value: adminCount, color: "text-blue-700", bg: "bg-blue-50/60", border: "border-blue-100/40", dot: "bg-blue-500" },
            { label: "HR Admins", value: hrCount, color: "text-purple-700", bg: "bg-purple-50/60", border: "border-purple-100/40", dot: "bg-purple-500" },
          ].map(k => (
            <div key={k.label} className={`${k.bg} border ${k.border} rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm`}>
              <div>
                <p className={`text-[10px] font-bold ${k.color.replace('700', '500')} uppercase tracking-wider`}>{k.label}</p>
                <p className={`text-2xl font-black ${k.color} mt-1`}>{k.value}</p>
              </div>
              <span className={`w-3 h-3 rounded-full ${k.dot}`} />
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex-1 max-w-xs focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/15 transition-all shadow-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by name or email..." className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full" />
          </div>
          <label className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 shadow-sm transition-colors">
            <input type="checkbox" checked={includeInactive} onChange={e => { setIncludeInactive(e.target.checked); setPage(1); }}
              className="w-4 h-4 rounded border-slate-300 accent-brand-600" />
            <span className="text-xs font-medium text-slate-600">Include inactive</span>
          </label>
        </div>

        {/* Table */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-16 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-700">No users found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50/60">
                    {["User","Contact Details","Role","Status","Actions"].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-indigo-700 uppercase tracking-wider px-5 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => {
                    const rc = roleConfig[u.role] || roleConfig.hr_admin;
                    const isActive = u.is_active !== false;
                    const initials = (u.full_name || "U").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
                    return (
                      <motion.tr key={u._id || u.id || i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                        className="border-t border-slate-50 hover:bg-brand-50/20 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0 bg-gradient-to-br from-brand-500 to-indigo-600`}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{u.full_name || "—"}</p>
                              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Joined recently</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <Mail className="w-3.5 h-3.5 text-slate-400" /> {u.email}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <Phone className="w-3.5 h-3.5 text-slate-400" /> {u.phone || "—"}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${rc.bg} ${rc.text} ${rc.border}`}>
                            <rc.icon className="w-3 h-3" /> {rc.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 'bg-slate-100 text-slate-500 border-slate-200/50'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditForm({ full_name: u.full_name||"", email: u.email||"", phone: u.phone||"" }); setShowEditModal(u); setError(""); }}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1.5 text-xs font-bold transition-colors" title="Edit">
                              <Edit className="w-3.5 h-3.5" /> Edit
                            </button>
                            {isActive && (
                              <button onClick={() => setShowDeactivateModal(u)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center gap-1.5 text-xs font-bold transition-colors" title="Deactivate">
                                <Trash2 className="w-3.5 h-3.5" /> Disable
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">

              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-white">Create Admin User</h3>
                  <p className="text-sm text-white/75 mt-0.5">Send a system invitation with credentials</p>
                </div>
                <button onClick={() => { setShowCreateModal(false); setError(""); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <XIcon className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 flex-1">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-red-700">{error}</span>
                  </div>
                )}

                <form id="create-user-form" onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Full Name *</label>
                      <input value={createForm.full_name} onChange={e=>setCreateForm(f=>({...f,full_name:e.target.value}))} required
                        placeholder="Jane Doe"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all bg-slate-50 focus:bg-white" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Email Address *</label>
                      <input type="email" value={createForm.email} onChange={e=>setCreateForm(f=>({...f,email:e.target.value}))} required
                        placeholder="jane@company.com"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all bg-slate-50 focus:bg-white" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Phone Number *</label>
                      <input value={createForm.phone} onChange={e=>setCreateForm(f=>({...f,phone:e.target.value}))} required
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all bg-slate-50 focus:bg-white" />
                    </div>
                  </div>

                  {/* Role visual picker */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Role *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "hr_admin", label: "HR Admin", desc: "Manage HR operations", color: "border-blue-300 bg-blue-50 text-blue-700" },
                        ...(isSuperAdmin ? [{ value: "org_admin", label: "Org Admin", desc: "Manage organisation", color: "border-indigo-300 bg-indigo-50 text-indigo-700" }] : [])
                      ].map(r => (
                        <button key={r.value} type="button" onClick={() => setCreateForm(f=>({...f,role:r.value}))}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${createForm.role===r.value ? r.color+" shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                          <p className={`text-xs font-bold ${createForm.role===r.value ? "" : "text-slate-700"}`}>{r.label}</p>
                          <p className={`text-[10px] mt-0.5 ${createForm.role===r.value ? "opacity-75" : "text-slate-400"}`}>{r.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {isSuperAdmin && createForm.role === "org_admin" && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Organization ID *</label>
                      <input value={createForm.organization_id} onChange={e=>setCreateForm(f=>({...f,organization_id:e.target.value}))} required
                        placeholder="org_123456"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all bg-slate-50 focus:bg-white font-mono" />
                    </motion.div>
                  )}

                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/60 flex gap-2.5 items-start">
                    <Mail className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-blue-800">Email Invitation</p>
                      <p className="text-[10px] text-blue-600/80 mt-0.5">An email will be sent with login credentials (default password: "Welcome1").</p>
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/80">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-white transition-colors">
                  Cancel
                </button>
                <motion.button type="submit" form="create-user-form" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-70">
                  {formLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : <><UserPlus className="w-4 h-4" /> Create User</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit User Modal ── */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditModal(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">

              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Edit User Details</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{showEditModal?.full_name}</p>
                </div>
                <button onClick={() => { setShowEditModal(null); setError(""); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <XIcon className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-red-700">{error}</span>
                  </div>
                )}

                <form id="edit-user-form" onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Full Name</label>
                    <input value={editForm.full_name} onChange={e=>setEditForm(f=>({...f,full_name:e.target.value}))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all bg-slate-50 focus:bg-white" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Email Address</label>
                    <input type="email" value={editForm.email} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all bg-slate-50 focus:bg-white" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Phone Number</label>
                    <input value={editForm.phone} onChange={e=>setEditForm(f=>({...f,phone:e.target.value}))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all bg-slate-50 focus:bg-white" />
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/80">
                <button onClick={() => setShowEditModal(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-white transition-colors">
                  Cancel
                </button>
                <motion.button type="submit" form="edit-user-form" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-70">
                  {formLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Edit className="w-4 h-4" /> Save Changes</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Deactivate Confirm Modal ── */}
      <AnimatePresence>
        {showDeactivateModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeactivateModal(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden">
              
              <div className="p-6 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4 text-red-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Disable User Account</h3>
                <p className="text-sm text-slate-600">
                  Are you sure you want to disable <strong className="text-slate-900">{showDeactivateModal.full_name}</strong>? They will be logged out immediately and lose access to the system.
                </p>
              </div>
              
              <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50 mt-2">
                <button onClick={() => setShowDeactivateModal(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-white transition-colors">
                  Cancel
                </button>
                <motion.button onClick={handleDeactivate} disabled={formLoading} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl text-sm font-bold shadow-md shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-70">
                  {formLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Disabling...</> : <><Trash2 className="w-4 h-4" /> Disable User</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}