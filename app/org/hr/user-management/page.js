"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Search, X, Mail, Phone, Shield,
  CheckCircle2, XCircle, Edit, Trash2, AlertCircle,
  RefreshCw, ChevronLeft, ChevronRight, Eye, EyeOff,
  UserPlus, Building
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";
import {
  createAdminUser, listAdminUsers, updateAdminUser, deactivateAdminUser
} from "@/lib/api";

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

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="User Management" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.type==="error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Admin Users</h2>
            <p className="text-sm text-slate-500">
              {isSuperAdmin ? "Manage org admins and HR admins" : "Manage HR admin users in your organization"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchUsers}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
              <RefreshCw className={`w-4 h-4 text-slate-500 ${loading?"animate-spin":""}`} />
            </button>
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
              <UserPlus className="w-4 h-4" /> Create Admin User
            </motion.button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex-1 max-w-xs focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by name or email..." className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full" />
          </div>
          <label className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
            <input type="checkbox" checked={includeInactive} onChange={e => { setIncludeInactive(e.target.checked); setPage(1); }}
              className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-xs font-medium text-slate-600">Show inactive</span>
          </label>
          <div className="ml-auto text-xs text-slate-400">
            {totalUsers} total user{totalUsers !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Table */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80">
                    {["User","Email","Phone","Role","Status","Actions"].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <motion.tr key={u._id || u.id || i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                      className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {(u.full_name || "U").split(" ").map(n=>n[0]).join("").slice(0,2)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{u.full_name || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">{u.email}</td>
                      <td className="px-5 py-3 text-xs text-slate-600">{u.phone || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          u.role === "org_admin" ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                          u.role === "hr_admin"  ? "bg-blue-50 text-blue-600 border-blue-200" :
                          "bg-purple-50 text-purple-600 border-purple-200"
                        }`}>
                          {u.role === "org_admin" ? "Org Admin" : u.role === "hr_admin" ? "HR Admin" : u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          u.is_active !== false ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                        }`}>
                          {u.is_active !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setEditForm({ full_name: u.full_name||"", email: u.email||"", phone: u.phone||"" }); setShowEditModal(u); setError(""); }}
                            className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors" title="Edit">
                            <Edit className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          {u.is_active !== false && (
                            <button onClick={() => setShowDeactivateModal(u)}
                              className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors" title="Deactivate">
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Create User Modal ── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Create Admin User</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Default password "Welcome1" will be set. User must change on first login.</p>
                </div>
                <button onClick={() => { setShowCreateModal(false); setError(""); }} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-xs text-red-700">{error}</span>
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Full Name *</label>
                  <input value={createForm.full_name} onChange={e=>setCreateForm(f=>({...f,full_name:e.target.value}))} required
                    placeholder="e.g. HR Manager"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email *</label>
                  <input type="email" value={createForm.email} onChange={e=>setCreateForm(f=>({...f,email:e.target.value}))} required
                    placeholder="hradmin@company.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Phone *</label>
                  <input value={createForm.phone} onChange={e=>setCreateForm(f=>({...f,phone:e.target.value}))} required
                    placeholder="+919876543210"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Role *</label>
                  <select value={createForm.role} onChange={e=>setCreateForm(f=>({...f,role:e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="hr_admin">HR Admin</option>
                    {isSuperAdmin && <option value="org_admin">Org Admin</option>}
                  </select>
                </div>
                {isSuperAdmin && createForm.role === "org_admin" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Organization ID *</label>
                    <input value={createForm.organization_id} onChange={e=>setCreateForm(f=>({...f,organization_id:e.target.value}))} required
                      placeholder="65abc123def456"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 font-mono" />
                  </div>
                )}

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-[10px] text-blue-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> An invitation email with login credentials will be sent to the user.
                  </p>
                </div>

                <motion.button type="submit" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-70">
                  {formLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {formLoading ? "Creating..." : "Create User & Send Invite"}
                </motion.button>
              </form>
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
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Edit User</h3>
                <button onClick={() => { setShowEditModal(null); setError(""); }} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-xs text-red-700">{error}</span>
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Full Name</label>
                  <input value={editForm.full_name} onChange={e=>setEditForm(f=>({...f,full_name:e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email</label>
                  <input type="email" value={editForm.email} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Phone</label>
                  <input value={editForm.phone} onChange={e=>setEditForm(f=>({...f,phone:e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-70">
                  {formLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Edit className="w-4 h-4" />}
                  {formLoading ? "Saving..." : "Save Changes"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Deactivate Confirm Modal ── */}
      <AnimatePresence>
        {showDeactivateModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeactivateModal(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Deactivate User</h3>
                  <p className="text-xs text-slate-500">This action can be reversed later.</p>
                </div>
              </div>
              <p className="text-sm text-slate-700 mb-5">
                Are you sure you want to deactivate <strong>{showDeactivateModal.full_name}</strong> ({showDeactivateModal.email})? They will lose access immediately.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeactivateModal(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  onClick={handleDeactivate} disabled={formLoading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-70">
                  {formLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Deactivate
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
