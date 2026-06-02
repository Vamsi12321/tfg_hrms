"use client";

import { motion } from "framer-motion";
import {
  Wallet, TrendingUp, Calendar, Download, IndianRupee,
  CheckCircle2, Clock, Users, PieChart
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { employees, payrollSummary, expenseCategories } from "@/lib/fakeData";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function PayrollPage() {
  const formatCurrency = (val) => `₹${(val / 100000).toFixed(1)}L`;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Payroll" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Monthly Payroll", value: formatCurrency(payrollSummary.totalPayroll), icon: Wallet, color: "blue" },
            { label: "Avg Salary", value: formatCurrency(payrollSummary.avgSalary), icon: IndianRupee, color: "green" },
            { label: "Processed", value: `${payrollSummary.processed}/${employees.length}`, icon: CheckCircle2, color: "emerald" },
            { label: "Next Pay Date", value: "May 31", icon: Calendar, color: "purple" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
              >
                <Icon className={`w-5 h-5 text-${stat.color}-500 mb-3`} />
                <p className="text-xl font-black text-slate-900">{stat.value}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Expense Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900 mb-4">Expense Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPie>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {expenseCategories.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-[10px] text-slate-600 font-medium">{cat.name} ({cat.value}%)</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Payroll Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">May 2025 Payroll</h3>
              <button className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Employee</th>
                    <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Department</th>
                    <th className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Gross</th>
                    <th className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Deductions</th>
                    <th className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Net Pay</th>
                    <th className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.slice(0, 8).map((emp, i) => {
                    const gross = Math.round(emp.salary / 12);
                    const deductions = Math.round(gross * 0.2);
                    const net = gross - deductions;
                    const processed = i < 7;
                    return (
                      <tr key={emp.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white text-[9px] font-bold">
                              {emp.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <span className="text-xs font-semibold text-slate-800">{emp.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600">{emp.department}</td>
                        <td className="px-5 py-3 text-xs text-slate-700 font-medium text-right">₹{(gross / 1000).toFixed(0)}K</td>
                        <td className="px-5 py-3 text-xs text-red-500 font-medium text-right">-₹{(deductions / 1000).toFixed(0)}K</td>
                        <td className="px-5 py-3 text-xs text-slate-900 font-bold text-right">₹{(net / 1000).toFixed(0)}K</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${processed ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                            {processed ? "Paid" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
