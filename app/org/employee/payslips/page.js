"use client";

import { motion } from "framer-motion";
import { Wallet, Download, Calendar, IndianRupee, TrendingUp } from "lucide-react";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";

export default function MyPayslipsPage() {
  const { user } = useAuth();

  // Fake payslip data for the logged-in employee
  const currentPayslip = {
    month: "May 2025",
    basic: 120000,
    hra: 48000,
    special: 32000,
    gross: 200000,
    pf: 14400,
    tax: 25000,
    professional: 200,
    totalDeductions: 39600,
    netPay: 160400,
  };

  const payslipHistory = [
    { month: "May 2025", net: 160400, status: "pending" },
    { month: "Apr 2025", net: 160400, status: "paid" },
    { month: "Mar 2025", net: 158200, status: "paid" },
    { month: "Feb 2025", net: 158200, status: "paid" },
    { month: "Jan 2025", net: 155000, status: "paid" },
  ];

  const formatCurrency = (val) => `₹${val.toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Payslips" />

      <div className="p-6 space-y-6">
        {/* Current Month Payslip */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Current Payslip</h3>
              <p className="text-sm text-slate-500">{currentPayslip.month}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-xs font-bold border border-brand-200 hover:bg-brand-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </motion.button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Earnings */}
            <div className="p-4 rounded-xl bg-green-50/50 border border-green-100">
              <h4 className="text-xs font-bold text-green-700 mb-3">Earnings</h4>
              <div className="space-y-2">
                {[
                  { label: "Basic Salary", value: currentPayslip.basic },
                  { label: "HRA", value: currentPayslip.hra },
                  { label: "Special Allowance", value: currentPayslip.special },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">{item.label}</span>
                    <span className="text-xs font-semibold text-slate-800">{formatCurrency(item.value)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-green-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-green-700">Gross</span>
                  <span className="text-sm font-black text-green-700">{formatCurrency(currentPayslip.gross)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="p-4 rounded-xl bg-red-50/50 border border-red-100">
              <h4 className="text-xs font-bold text-red-700 mb-3">Deductions</h4>
              <div className="space-y-2">
                {[
                  { label: "Provident Fund", value: currentPayslip.pf },
                  { label: "Income Tax", value: currentPayslip.tax },
                  { label: "Professional Tax", value: currentPayslip.professional },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">{item.label}</span>
                    <span className="text-xs font-semibold text-red-600">-{formatCurrency(item.value)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-red-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-red-700">Total Deductions</span>
                  <span className="text-sm font-black text-red-700">-{formatCurrency(currentPayslip.totalDeductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Pay */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 flex flex-col items-center justify-center">
              <IndianRupee className="w-6 h-6 text-brand-500 mb-2" />
              <p className="text-[10px] text-slate-500 font-medium">Net Pay</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(currentPayslip.netPay)}</p>
              <p className="text-[10px] text-brand-600 font-medium mt-1">Credited on 31st</p>
            </div>
          </div>
        </motion.div>

        {/* Payslip History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Payslip History</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {payslipHistory.map((slip, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{slip.month}</p>
                    <p className="text-[10px] text-slate-400">Net: {formatCurrency(slip.net)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    slip.status === "paid" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                  }`}>{slip.status === "paid" ? "✓ Paid" : "⏳ Pending"}</span>
                  {slip.status === "paid" && (
                    <button className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
