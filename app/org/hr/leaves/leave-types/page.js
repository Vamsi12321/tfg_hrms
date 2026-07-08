"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit, Trash2, CheckCircle2, AlertCircle, X,
  CalendarDays, Repeat, ArrowRightLeft, Clock, Infinity, Tag
} from "lucide-react";
import { getLeaveConfig, addLeaveType, updateLeaveType, deleteLeaveType } from "@/lib/api";

const blank = { name: "", code: "", days_per_year: "", is_paid: true, carry_forward: false, max_carry_forward_days: 0, applicable_after_days: 0, description: "", accrual_type: "yearly", days_per_month: 0 };

// Assign a deterministic color per leave type based on index
const cardColors = [
  { bg: "bg-blue-50/60",    border: "border-blue-200/50",   icon: "bg-blue-100 border-blue-200/60 text-blue-600",   pill: "bg-blue-100 text-blue-700",   bar: "bg-blue-500" },
  { bg: "bg-emerald-50/60", border: "border-emerald-200/50", icon: "bg-emerald-100 border-emerald-200/60 text-emerald-600", pill: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
  { bg: "bg-violet-50/60",  border: "border-violet-200/50",  icon: "bg-violet-100 border-violet-200/60 text-violet-600",  pill: "bg-violet-100 text-violet-700",  bar: "bg-violet-500" },
  { bg: "bg-rose-50/60",    border: "border-rose-200/50",    icon: "bg-rose-100 border-rose-200/60 text-rose-600",    pill: "bg-rose-100 text-rose-700",    bar: "bg-rose-500" },
  { bg: "bg-amber-50/60",   border: "border-amber-200/50",   icon: "bg-amber-100 border-amber-200/60 text-amber-600",   pill: "bg-amber-100 text-amber-700",   bar: "bg-amber-500" },
  { bg: "bg-cyan-50/60",    border: "border-cyan-200/50",    icon: "bg-cyan-100 border-cyan-200/60 text-cyan-600",    pill: "bg-cyan-100 text-cyan-700",    bar: "bg-cyan-500" },
];

export default function LeaveTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(blank);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const fetchTypes = async () => {
    setLoading(true);
    const res = await getLeaveConfig();
    if (res.ok && res.data) setTypes(res.data.leave_types || []);
    setLoading(false);
  };

  useEffect(() => { fetchTypes(); }, []);

  const openAdd = () => { setForm(blank); setEditItem(null); setShowAdd(true); };
  const openEdit = (lt) => {
    setForm({ name: lt.name, code: lt.code, days_per_year: lt.days_per_year, is_paid: lt.is_paid !== false, carry_forward: !!lt.carry_forward, max_carry_forward_days: lt.max_carry_forward_days || 0, applicable_after_days: lt.applicable_after_days || 0, description: lt.description || "", accrual_type: lt.accrual_type || "yearly", days_per_month: lt.days_per_month || 0 });
    setEditItem(lt); setShowAdd(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const payload = { name: form.name, code: form.code.toUpperCase(), days_per_year: parseInt(form.days_per_year) || 0, is_paid: form.is_paid, carry_forward: form.carry_forward, max_carry_forward_days: parseInt(form.max_carry_forward_days) || 0, applicable_after_days: parseInt(form.applicable_after_days) || 0, description: form.description, accrual_type: form.accrual_type || "yearly", days_per_month: parseFloat(form.days_per_month) || 0 };
    if (editItem) {
      if (form.name === editItem.name) delete payload.name;
      if (form.code.toUpperCase() === (editItem.code || "").toUpperCase()) delete payload.code;
    }
    const res = editItem ? await updateLeaveType(editItem.id || editItem._id || editItem.code, payload) : await addLeaveType(payload);
    if (res.ok) { showToast(editItem ? "Leave type updated" : "Leave type added"); setShowAdd(false); fetchTypes(); }
    else { const m = typeof res.data?.detail === "string" ? res.data.detail : Array.isArray(res.data?.detail) ? res.data.detail.map(e => e.msg).join(", ") : "Failed"; showToast(m, "error"); }
    setFormLoading(false);
  };

  const handleDelete = async (lt) => {
    if (!confirm(`Delete "${lt.name}"?`)) return;
    const res = await deleteLeaveType(lt.id || lt._id || lt.code);
    if (res.ok) { showToast(`"${lt.name}" deleted`); fetchTypes(); }
    else showToast(res.data?.detail || "Cannot delete", "error");
  };

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Leave Types</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">{types.length} leave types configured for your organization</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/25 transition-shadow">
          <Plus className="w-3.5 h-3.5" /> Add Leave Type
        </motion.button>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="p-16 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading leave types…</p>
        </div>
      ) : types.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No leave types yet</p>
          <button onClick={openAdd} className="mt-3 text-xs font-bold text-brand-600 hover:underline">+ Add first leave type</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((lt, i) => {
            const c = cardColors[i % cardColors.length];
            return (
              <motion.div key={lt.id || i}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group`}>
                {/* Color bar top */}
                <div className={`h-1 w-full ${c.bar}`} />
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${c.icon}`}>
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{lt.name}</h3>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${c.pill}`}>{lt.code}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${lt.is_active !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-slate-100 text-slate-400 border-slate-200/50"}`}>
                      {lt.is_active !== false ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Main stat */}
                  <div className={`rounded-xl ${c.bg} border ${c.border} px-4 py-3 mb-4 flex items-center justify-between`}>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Days / Year</p>
                      <p className="text-2xl font-black text-slate-900 mt-0.5">
                        {lt.days_per_year === -1 ? <span className="flex items-center gap-1"><Infinity className="w-6 h-6" /> </span> : lt.days_per_year}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Accrual</p>
                      <p className="text-xs font-bold text-slate-700 capitalize mt-0.5">{lt.accrual_type || "Yearly"}</p>
                    </div>
                  </div>

                  {/* Meta pills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${lt.is_paid !== false ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" : "bg-slate-100 text-slate-500 border border-slate-200/50"}`}>
                      {lt.is_paid !== false ? "💰 Paid" : "Unpaid"}
                    </span>
                    {lt.carry_forward && (
                      <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/50">
                        ↩ Carry {lt.max_carry_forward_days}d
                      </span>
                    )}
                    {lt.applicable_after_days > 0 && (
                      <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50">
                        ⏳ After {lt.applicable_after_days}d
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(lt)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-colors">
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDelete(lt)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAdd(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

              {/* Modal header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-brand-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{editItem ? "Edit" : "Add"} Leave Type</h3>
                </div>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-5">
                <form onSubmit={handleSubmit} className="space-y-4" id="leave-type-form">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Name *</label>
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" placeholder="Annual Leave" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Code *</label>
                      <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all uppercase font-bold" placeholder="AL" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Days / Year</label>
                      <input type="number" value={form.days_per_year} onChange={e => setForm(f => ({ ...f, days_per_year: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" placeholder="12" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Applicable After (days)</label>
                      <input type="number" value={form.applicable_after_days} onChange={e => setForm(f => ({ ...f, applicable_after_days: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" placeholder="90" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Accrual Type</label>
                      <select value={form.accrual_type} onChange={e => setForm(f => ({ ...f, accrual_type: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 transition-all bg-white cursor-pointer">
                        <option value="yearly">Yearly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Days / Month</label>
                      <input type="number" step="0.1" value={form.days_per_month} onChange={e => setForm(f => ({ ...f, days_per_month: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" placeholder="1.5" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
                    <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" placeholder="Brief description of this leave type" />
                  </div>

                  {/* Toggle options */}
                  <div className="space-y-2">
                    {[
                      { label: "Paid Leave", desc: "Salary is paid during this leave", key: "is_paid", color: "emerald" },
                      { label: "Carry Forward", desc: "Unused days roll over to next year", key: "carry_forward", color: "blue" },
                    ].map(({ label, desc, key, color }) => (
                      <label key={key} className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${form[key] ? `bg-${color}-50/60 border-${color}-200/50` : "bg-slate-50/60 border-slate-200/50"}`}>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{label}</p>
                          <p className="text-[10px] text-slate-400">{desc}</p>
                        </div>
                        <div className={`w-9 h-5 rounded-full relative transition-all ${form[key] ? `bg-${color}-500` : "bg-slate-300"}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form[key] ? "left-4" : "left-0.5"}`} />
                          <input type="checkbox" checked={!!form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="sr-only" />
                        </div>
                      </label>
                    ))}
                  </div>

                  {form.carry_forward && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Max Carry Forward Days</label>
                      <input type="number" value={form.max_carry_forward_days} onChange={e => setForm(f => ({ ...f, max_carry_forward_days: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" placeholder="15" />
                    </motion.div>
                  )}
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 flex gap-3">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Cancel</button>
                <motion.button type="submit" form="leave-type-form" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70 flex items-center justify-center gap-2">
                  {formLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : <><CheckCircle2 className="w-4 h-4" />{editItem ? "Update Type" : "Add Leave Type"}</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
