"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Plus, Calendar, CheckCircle2, XCircle,
  Palmtree, X, AlertCircle, Ban
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { getLeaveBalance, getLeaveConfig, listLeaves, applyLeave, cancelLeave } from "@/lib/api";

export default function MyLeavesPage() {
  const [balances, setBalances] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leave_type_code: "", start_date: "", end_date: "",
    reason: "", is_half_day: false, half_day_type: "first_half"
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  // Fetch balance + config + history on mount
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    // Get balance
    const balRes = await getLeaveBalance();
    if (balRes.ok && balRes.data) {
      setBalances(balRes.data.balances || []);
    }
    // Get leave config (for types in apply form)
    const cfgRes = await getLeaveConfig();
    if (cfgRes.ok && cfgRes.data) {
      setLeaveTypes(cfgRes.data.leave_types || []);
    }
    // Get my leave requests
    const lRes = await listLeaves({ limit: 50 });
    if (lRes.ok && lRes.data) {
      setLeaves(lRes.data.leaves || []);
    }
    setLoading(false);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const payload = {
      leave_type_code: applyForm.leave_type_code,
      start_date: applyForm.start_date,
      end_date: applyForm.end_date,
      reason: applyForm.reason,
      is_half_day: applyForm.is_half_day,
    };
    if (applyForm.is_half_day) payload.half_day_type = applyForm.half_day_type;
    const res = await applyLeave(payload);
    if (res.ok) {
      showToast("Leave request submitted!");
      setShowApplyModal(false);
      setApplyForm({ leave_type_code: "", start_date: "", end_date: "", reason: "", is_half_day: false, half_day_type: "first_half" });
      fetchAll();
    } else {
      showToast(res.data?.detail?.[0]?.msg || res.data?.detail || "Failed to apply", "error");
    }
    setFormLoading(false);
  };

  const handleCancel = async (leaveId) => {
    const res = await cancelLeave(leaveId);
    if (res.ok) {
      showToast("Leave cancelled");
      fetchAll();
    } else {
      showToast(res.data?.detail || "Cannot cancel this leave", "error");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Leaves" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Leave Balance - Compact table view */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Leave Balance</h3>
            <span className="text-[10px] text-slate-400 font-medium">{new Date().getFullYear()}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  {["Type", "Total", "Used", "Pending", "Available"].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {balances.map((bal, i) => (
                  <tr key={bal.leave_type_code || i} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{bal.leave_type_code}</span>
                        <span className="text-xs font-medium text-slate-800">{bal.leave_type_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{bal.total === -1 ? "∞" : bal.total}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{bal.used}</td>
                    <td className="px-4 py-2.5 text-xs text-amber-600 font-medium">{bal.pending || 0}</td>
                    <td className="px-4 py-2.5 text-xs font-bold text-green-600">{bal.total === -1 ? "∞" : bal.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Apply Leave Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">My Leave History</h3>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
            <Plus className="w-4 h-4" /> Apply Leave
          </motion.button>
        </div>

        {/* Leave History */}
        {leaves.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
            <Palmtree className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">No leave requests yet</p>
            <p className="text-xs text-slate-400 mt-1">Apply for leave using the button above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaves.map((leave, i) => {
              const statusColors = {
                approved: { border: "border-l-green-500", bg: "bg-green-50", text: "text-green-600", label: "Approved" },
                pending: { border: "border-l-amber-500", bg: "bg-amber-50", text: "text-amber-600", label: "Pending" },
                cancelled: { border: "border-l-slate-400", bg: "bg-slate-50", text: "text-slate-500", label: "Cancelled" },
                rejected: { border: "border-l-red-500", bg: "bg-red-50", text: "text-red-600", label: "Rejected" },
              };
              const sc = statusColors[leave.status] || statusColors.pending;
              return (
                <motion.div key={leave.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-white rounded-2xl p-5 border border-slate-100 border-l-4 ${sc.border} shadow-sm hover:shadow-md transition-shadow`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{leave.leave_type_name || leave.leave_type_code}</h4>
                        {leave.is_half_day && <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Half Day</span>}
                      </div>
                      <span className={`inline-block mt-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                        {sc.label}
                      </span>
                    </div>
                    {(leave.status === "pending" || leave.status === "approved") && (
                      <button onClick={() => handleCancel(leave.id)} title="Cancel leave"
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                        <Ban className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{leave.start_date} → {leave.end_date}</span>
                    <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">{leave.days}d</span>
                  </div>
                  {leave.reason && <p className="text-xs text-slate-500 mt-2 italic">&quot;{leave.reason}&quot;</p>}
                  {leave.rejection_reason && (
                    <p className="text-xs text-red-500 mt-2 bg-red-50 px-3 py-1.5 rounded-lg">Reason: {leave.rejection_reason}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Apply Leave Modal */}
        <AnimatePresence>
          {showApplyModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowApplyModal(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-slate-900">Apply for Leave</h3>
                  <button onClick={() => setShowApplyModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Leave Type *</label>
                    <select value={applyForm.leave_type_code} onChange={e => setApplyForm(f => ({ ...f, leave_type_code: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required>
                      <option value="">Select leave type...</option>
                      {leaveTypes.filter(lt => lt.is_active !== false).map(lt => (
                        <option key={lt.code} value={lt.code}>{lt.name} ({lt.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">From *</label>
                      <input type="date" value={applyForm.start_date} onChange={e => setApplyForm(f => ({ ...f, start_date: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">To *</label>
                      <input type="date" value={applyForm.end_date} onChange={e => setApplyForm(f => ({ ...f, end_date: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={applyForm.is_half_day}
                        onChange={e => setApplyForm(f => ({ ...f, is_half_day: e.target.checked }))}
                        className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                      <span className="text-xs font-medium text-slate-700">Half Day</span>
                    </label>
                    {applyForm.is_half_day && (
                      <select value={applyForm.half_day_type} onChange={e => setApplyForm(f => ({ ...f, half_day_type: e.target.value }))}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none">
                        <option value="first_half">First Half</option>
                        <option value="second_half">Second Half</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason *</label>
                    <textarea rows={3} value={applyForm.reason} onChange={e => setApplyForm(f => ({ ...f, reason: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none"
                      placeholder="Enter reason for leave..." required />
                  </div>
                  <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                    {formLoading ? "Submitting..." : "Submit Request"}
                  </motion.button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
