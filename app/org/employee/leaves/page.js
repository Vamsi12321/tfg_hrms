"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Plus, Calendar, CheckCircle2, XCircle,
  Palmtree, Stethoscope, Coffee, Home, X
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";

export default function MyLeavesPage() {
  const { user } = useAuth();
  const [showApplyModal, setShowApplyModal] = useState(false);

  const myLeaveBalance = [
    { type: "Earned Leave", total: 18, used: 5, icon: Palmtree, color: "blue" },
    { type: "Sick Leave", total: 12, used: 3, icon: Stethoscope, color: "red" },
    { type: "Casual Leave", total: 8, used: 2, icon: Coffee, color: "amber" },
    { type: "Work From Home", total: 24, used: 8, icon: Home, color: "green" },
  ];

  const myLeaveHistory = [
    { id: 1, type: "Earned Leave", from: "2025-04-10", to: "2025-04-12", days: 3, status: "approved", reason: "Family function" },
    { id: 2, type: "Sick Leave", from: "2025-03-05", to: "2025-03-06", days: 2, status: "approved", reason: "Fever" },
    { id: 3, type: "Work From Home", from: "2025-05-20", to: "2025-05-20", days: 1, status: "approved", reason: "Plumber visit" },
    { id: 4, type: "Casual Leave", from: "2025-06-01", to: "2025-06-02", days: 2, status: "pending", reason: "Personal work" },
  ];

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Leaves" />

      <div className="p-6 space-y-6">
        {/* Leave Balance */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {myLeaveBalance.map((leave, i) => {
            const Icon = leave.icon;
            const remaining = leave.total - leave.used;
            const percentage = Math.round((leave.used / leave.total) * 100);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl bg-${leave.color}-50 flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 text-${leave.color}-500`} />
                  </div>
                  <span className="text-lg font-black text-slate-900">{remaining}</span>
                </div>
                <p className="text-xs font-bold text-slate-700">{leave.type}</p>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                    className={`h-full rounded-full bg-${leave.color}-500`}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{leave.used} used of {leave.total}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Apply Leave Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">My Leave History</h3>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" /> Apply Leave
          </motion.button>
        </div>

        {/* Leave History */}
        <div className="space-y-3">
          {myLeaveHistory.map((leave, i) => (
            <motion.div
              key={leave.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{leave.type}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-600">{leave.from} → {leave.to} ({leave.days} day{leave.days > 1 ? "s" : ""})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 italic">&quot;{leave.reason}&quot;</p>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full ${
                  leave.status === "approved" ? "bg-green-50 text-green-600 border border-green-200" :
                  leave.status === "pending" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                  "bg-red-50 text-red-600 border border-red-200"
                }`}>
                  {leave.status === "approved" ? "✓ Approved" : leave.status === "pending" ? "⏳ Pending" : "✗ Rejected"}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Apply Leave Modal */}
        <AnimatePresence>
          {showApplyModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowApplyModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-slate-900">Apply for Leave</h3>
                  <button onClick={() => setShowApplyModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Leave Type</label>
                    <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                      <option>Earned Leave</option>
                      <option>Sick Leave</option>
                      <option>Casual Leave</option>
                      <option>Work From Home</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">From</label>
                      <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">To</label>
                      <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason</label>
                    <textarea rows={3} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none" placeholder="Enter reason for leave..." />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setShowApplyModal(false)}
                    className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20"
                  >
                    Submit Request
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
