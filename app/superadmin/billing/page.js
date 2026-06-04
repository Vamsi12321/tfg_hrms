"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Sparkles, Send, CheckCircle2, ChevronRight,
  TrendingUp, RefreshCw, X, ArrowUpRight, BarChart3, AlertCircle
} from "lucide-react";
import TopBar from "@/components/TopBar";
import {
  subscriptionPlans,
  organizations as initialOrgs,
  platformStats
} from "@/lib/superAdminData";

export default function BillingPage() {
  const [orgs, setOrgs] = useState(initialOrgs);
  const [alertMessage, setAlertMessage] = useState("");
  const [selectedOrgForUpgrade, setSelectedOrgForUpgrade] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");

  const handleSendInvoice = (orgName) => {
    showAlert(`Invoice and billing receipt sent successfully to ${orgName}'s administrator.`);
  };

  const handleOpenUpgrade = (org) => {
    setSelectedOrgForUpgrade(org);
    setNewPlanName(org.plan);
    setIsUpgradeModalOpen(true);
  };

  const handleSaveUpgrade = (e) => {
    e.preventDefault();
    if (!selectedOrgForUpgrade) return;

    const priceMap = {
      Starter: 4900,
      Business: 19900,
      Enterprise: 49900,
    };

    setOrgs(
      orgs.map((o) =>
        o.id === selectedOrgForUpgrade.id
          ? {
              ...o,
              plan: newPlanName,
              monthlyRevenue: o.status === "suspended" ? 0 : priceMap[newPlanName] || 0,
            }
          : o
      )
    );

    setIsUpgradeModalOpen(false);
    showAlert(`Successfully changed ${selectedOrgForUpgrade.name}'s subscription plan to ${newPlanName}.`);
  };

  const showAlert = (msg) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(""), 4000);
  };

  // Dynamically calculate MRR & ARR based on state (excluding suspended)
  const currentMrr = orgs.reduce((acc, curr) => {
    if (curr.status === "suspended") return acc;
    return acc + curr.monthlyRevenue;
  }, 0);
  
  const currentArr = currentMrr * 12;

  // Plan distributions count
  const planCounts = orgs.reduce(
    (acc, curr) => {
      acc[curr.plan] = (acc[curr.plan] || 0) + 1;
      return acc;
    },
    { Starter: 0, Business: 0, Enterprise: 0 }
  );

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Subscription & Revenue Controls" />

      <div className="p-6 space-y-6">
        {/* Toast Alert */}
        <AnimatePresence>
          {alertMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{alertMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-slate-900">Subscription & Revenue Controls</h2>
          <p className="text-xs text-slate-500">Monitor SaaS revenue flow, subscription packages, and client billing statements.</p>
        </div>

        {/* Revenue Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Platform MRR", value: `₹${currentMrr.toLocaleString()}`, color: "amber", desc: "Monthly Recurring Revenue" },
            { label: "Projected ARR", value: `₹${currentArr.toLocaleString()}`, color: "green", desc: "Annual Recurring Revenue" },
            { label: "Average Revenue Per Tenant", value: `₹${Math.round(currentMrr / orgs.length).toLocaleString()}`, color: "blue", desc: "ARPU metric" },
            { label: "Revenue Churn Rate", value: `${platformStats.churnRate}%`, color: "purple", desc: "Last 30 days target" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-default">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Plan Distribution Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Plan Tier Distribution</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["Starter", "Business", "Enterprise"].map((planName) => {
              const count = planCounts[planName] || 0;
              const pct = orgs.length > 0 ? (count / orgs.length) * 100 : 0;
              const color = planName === "Enterprise" ? "bg-purple-500" : planName === "Business" ? "bg-blue-500" : "bg-emerald-500";
              const textColor = planName === "Enterprise" ? "text-purple-600" : planName === "Business" ? "text-blue-600" : "text-emerald-600";
              return (
                <div key={planName} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className={textColor}>{planName}</span>
                    <span className="text-slate-500">{count} Orgs ({Math.round(pct)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Organizations Billing Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant Billing Status</h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Automated Invoicing Enabled</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Tenant Name</th>
                  <th className="px-6 py-4">Active Plan</th>
                  <th className="px-6 py-4">Monthly Rate</th>
                  <th className="px-6 py-4">Billing Status</th>
                  <th className="px-6 py-4">Next Renewal</th>
                  <th className="px-6 py-4 text-center">Invoicing controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                {orgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{org.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block text-xs font-extrabold px-2 py-0.5 rounded-md ${
                        org.plan === "Enterprise" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                        org.plan === "Business" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                        "bg-green-50 text-green-700 border border-green-100"
                      }`}>
                        {org.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700">
                      ₹{org.monthlyRevenue.toLocaleString()}/mo
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        org.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        org.status === "suspended" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                        "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {org.status === "active" ? "Paid" : org.status === "suspended" ? "Overdue" : "Trial"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {org.status === "suspended" ? "Suspended" : "2025-07-01"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenUpgrade(org)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        >
                          Modify Plan
                        </button>
                        <button
                          onClick={() => handleSendInvoice(org.name)}
                          disabled={org.status === "trial"}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            org.status === "trial"
                              ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                              : "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                          }`}
                          title="Dispatch Invoice Receipt"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscription Plan Tiers Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionPlans.map((planObj) => {
            const planColor =
              planObj.color === "purple" ? "from-purple-500 to-indigo-600 shadow-purple-500/10" :
              planObj.color === "blue" ? "from-blue-500 to-indigo-600 shadow-blue-500/10" :
              "from-emerald-500 to-teal-600 shadow-emerald-500/10";
            return (
              <div
                key={planObj.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between"
              >
                <div className={`p-5 bg-gradient-to-r ${planColor} text-white`}>
                  <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase bg-white/20 border border-white/20 w-max px-2 py-0.5 rounded">
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                    {planObj.id}
                  </div>
                  <h4 className="text-lg font-black mt-2">{planObj.name} Package</h4>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-black">{planObj.currency}{planObj.price.toLocaleString()}</span>
                    <span className="text-xs text-white/70">/ {planObj.period}</span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FEATURES INCLUDED</p>
                    <ul className="space-y-2 text-xs text-slate-600">
                      {planObj.features.map((feat, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-100 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HARD LIMITS</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                      <div>Employees: <span className="text-slate-800 font-bold">{planObj.limits.maxEmployees === -1 ? "Unlimited" : planObj.limits.maxEmployees}</span></div>
                      <div>Roles Limit: <span className="text-slate-800 font-bold">{planObj.limits.customRoles === -1 ? "Unlimited" : planObj.limits.customRoles}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Upgrade Plan Modal */}
        <AnimatePresence>
          {isUpgradeModalOpen && selectedOrgForUpgrade && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-900">Modify Plan Subscription</h3>
                  <button
                    onClick={() => setIsUpgradeModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveUpgrade} className="p-6 space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-xs text-slate-400 font-bold">CLIENT ACCOUNT</p>
                    <p className="text-sm font-bold text-slate-800">{selectedOrgForUpgrade.name}</p>
                    <p className="text-xs text-slate-500">Current Plan: <span className="font-bold text-amber-600">{selectedOrgForUpgrade.plan}</span></p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Allocate Subscription Plan</label>
                    <select
                      value={newPlanName}
                      onChange={(e) => setNewPlanName(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 bg-white transition-colors cursor-pointer"
                    >
                      <option value="Starter">Starter (₹4,900/mo)</option>
                      <option value="Business">Business (₹19,900/mo)</option>
                      <option value="Enterprise">Enterprise (₹49,900/mo)</option>
                    </select>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsUpgradeModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 transition-all"
                    >
                      Apply Plan Change
                    </button>
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
