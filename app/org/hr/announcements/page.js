"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Pin, Plus, X, Search, Edit, Trash2,
  CheckCircle2, AlertCircle, Eye
} from "lucide-react";
import TopBar from "@/components/TopBar";
import {
  createAnnouncement, updateAnnouncement,
  deleteAnnouncement
} from "@/lib/api";
import { useAnnouncements, useDepartments, useInvalidate } from "@/lib/queries";

export default function HRAnnouncementsPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    title: "", content: "", type: "general", priority: "normal",
    target_departments: [], is_pinned: false, expires_at: ""
  });

  const invalidate = useInvalidate();
  const params = { limit: 50 };
  if (typeFilter) params.type = typeFilter;
  if (deptFilter) params.department = deptFilter;
  const { data: announcementData, isLoading: loading } = useAnnouncements(params);
  const announcements = announcementData?.announcements || [];
  const { data: deptList = [] } = useDepartments();

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    const payload = { ...form, expires_at: form.expires_at || null };
    const res = await createAnnouncement(payload);
    if (res.ok) {
      showToast("Announcement created!");
      setShowCreateModal(false);
      setForm({ title: "", content: "", type: "general", priority: "normal", target_departments: [], is_pinned: false, expires_at: "" });
      invalidate("announcements");
    } else {
      setFormError(typeof res.data?.detail === "string" ? res.data.detail : Array.isArray(res.data?.detail) ? res.data.detail.map(e => e.msg).join(", ") : "Failed to create");
    }
    setFormLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!showEditModal) return;
    setFormError("");
    setFormLoading(true);
    const payload = { ...form, expires_at: form.expires_at || null };
    const res = await updateAnnouncement(showEditModal.id, payload);
    if (res.ok) {
      showToast("Announcement updated!");
      setShowEditModal(null);
      invalidate("announcements");
    } else {
      setFormError(typeof res.data?.detail === "string" ? res.data.detail : "Failed to update");
    }
    setFormLoading(false);
  };

  const handleDelete = async (ann) => {
    if (!confirm(`Delete "${ann.title}"?`)) return;
    const res = await deleteAnnouncement(ann.id);
    if (res.ok) { showToast("Deleted"); invalidate("announcements"); }
    else showToast("Failed to delete", "error");
  };

  const openEdit = (ann) => {
    setForm({
      title: ann.title || "", content: ann.content || "", type: ann.type || "general",
      priority: ann.priority || "normal", target_departments: ann.target_departments || [],
      is_pinned: ann.is_pinned || false, expires_at: ann.expires_at || ""
    });
    setFormError("");
    setShowEditModal(ann);
  };

  const filtered = announcements.filter(a => {
    if (!search) return true;
    return a.title?.toLowerCase().includes(search.toLowerCase()) || a.content?.toLowerCase().includes(search.toLowerCase());
  });

  const typeCfg = {
    general: { cls: "bg-slate-100 text-slate-600", label: "General" },
    urgent: { cls: "bg-red-100 text-red-700", label: "Urgent" },
    event: { cls: "bg-purple-100 text-purple-700", label: "Event" },
    policy: { cls: "bg-blue-100 text-blue-700", label: "Policy" },
    celebration: { cls: "bg-amber-100 text-amber-700", label: "Celebration" },
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Announcements" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 focus-within:border-brand-400">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                className="bg-transparent text-xs outline-none w-32 text-slate-700" />
            </div>
            <div className="flex gap-1">
              {[{ key: "", label: "All" }, { key: "urgent", label: "Urgent" }, { key: "event", label: "Events" }, { key: "policy", label: "Policy" }].map(t => (
                <button key={t.key} onClick={() => setTypeFilter(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${typeFilter === t.key ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-semibold text-slate-600 outline-none">
              <option value="">All Depts</option>
              {deptList.map(d => <option key={d.id||d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setForm({ title: "", content: "", type: "general", priority: "normal", target_departments: [], is_pinned: false, expires_at: "" }); setFormError(""); setShowCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
            <Plus className="w-4 h-4" /> New Announcement
          </motion.button>
        </div>

        {/* List */}
        {loading ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
            <Megaphone className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">No announcements</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ann, i) => {
              const tc = typeCfg[ann.type] || typeCfg.general;
              return (
                <motion.div key={ann.id || i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${tc.cls}`}>{tc.label}</span>
                        {ann.is_pinned && <Pin className="w-3 h-3 text-amber-500" />}
                        {ann.priority === "high" && <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">HIGH</span>}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{ann.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ann.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                        <span>{ann.created_by_name || "HR"}</span>
                        <span>{ann.created_at ? new Date(ann.created_at).toLocaleDateString() : ""}</span>
                        {ann.read_count != null && <span><Eye className="w-3 h-3 inline" /> {ann.read_count}/{ann.total_recipients || "?"}</span>}
                        {ann.target_departments?.length > 0 && <span className="text-brand-600">Depts: {ann.target_departments.join(", ")}</span>}
                        {ann.expires_at && <span>Expires: {ann.expires_at}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => openEdit(ann)}
                        className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center">
                        <Edit className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                      <button onClick={() => handleDelete(ann)}
                        className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowCreateModal(false); setShowEditModal(null); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">{showEditModal ? "Edit" : "New"} Announcement</h3>
                <button onClick={() => { setShowCreateModal(false); setShowEditModal(null); }} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={showEditModal ? handleUpdate : handleCreate} className="space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-red-700">{formError}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Announcement title"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Content *</label>
                  <textarea rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required placeholder="Full announcement text..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                      <option value="general">General</option>
                      <option value="urgent">Urgent</option>
                      <option value="event">Event</option>
                      <option value="policy">Policy</option>
                      <option value="celebration">Celebration</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Priority</label>
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Expires At</label>
                    <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
                        className="w-4 h-4 rounded border-slate-300 text-brand-600" />
                      Pin to top
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Target Departments</label>
                  <p className="text-[10px] text-slate-400 mb-2">Leave empty to send to all employees. Select specific departments to target.</p>
                  <div className="flex flex-wrap gap-2">
                    {deptList.map(dept => (
                      <label key={dept.id||dept.name} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer transition-all border ${form.target_departments.includes(dept.name) ? "bg-brand-50 border-brand-300 text-brand-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        <input type="checkbox" checked={form.target_departments.includes(dept.name)}
                          onChange={e => {
                            if (e.target.checked) setForm(f => ({ ...f, target_departments: [...f.target_departments, dept.name] }));
                            else setForm(f => ({ ...f, target_departments: f.target_departments.filter(d => d !== dept.name) }));
                          }}
                          className="w-3 h-3 rounded border-slate-300 text-brand-600" />
                        {dept.name}
                      </label>
                    ))}
                  </div>
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Saving..." : showEditModal ? "Update Announcement" : "Publish Announcement"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
