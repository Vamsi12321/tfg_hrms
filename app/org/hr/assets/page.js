"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Package, UserCheck, AlertTriangle, Monitor, Smartphone, Wrench, Search, Plus, Filter, HardDrive } from "lucide-react";
import TopBar from "@/components/TopBar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import Link from "next/link";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

export default function AssetManagementDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock Data
  const stats = [
    { label: "Total Assets", value: 345, icon: Package, color: "blue" },
    { label: "Assigned", value: 280, icon: UserCheck, color: "emerald" },
    { label: "In Maintenance", value: 12, icon: Wrench, color: "amber" },
    { label: "Lost / Damaged", value: 4, icon: AlertTriangle, color: "red" },
  ];

  const colorMap = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600" },
    red: { bg: "bg-red-50", icon: "text-red-600" },
  };

  const categoryData = [
    { name: "Laptops", value: 150, color: "#3b82f6" },
    { name: "Monitors", value: 85, color: "#10b981" },
    { name: "Phones", value: 60, color: "#8b5cf6" },
    { name: "Accessories", value: 50, color: "#f59e0b" },
  ];

  const recentAssignments = [
    { asset: "MacBook Pro M2", code: "LAP-042", to: "Sarah Connor", dept: "Engineering", date: "Today" },
    { asset: "Dell UltraSharp 27\"", code: "MON-118", to: "John Smith", dept: "Design", date: "Yesterday" },
    { asset: "iPhone 14", code: "PHN-012", to: "Mike Tyson", dept: "Sales", date: "2 days ago" },
    { asset: "Logitech MX Master 3", code: "ACC-099", to: "Bruce Wayne", dept: "Management", date: "3 days ago" },
  ];

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Asset Management" />

      <div className="p-4 md:p-6 space-y-6">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            {["overview", "inventory", "assignments", "maintenance"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                  activeTab === tab ? "bg-brand-50 text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input type="text" placeholder="Search assets..." 
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 transition-colors w-64 shadow-sm" />
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 shadow-sm transition-all">
              <Plus className="w-3.5 h-3.5" /> Add Asset
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        {activeTab === "overview" && (
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                const colors = colorMap[stat.color];
                return (
                  <motion.div key={i} variants={fadeUp} whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm cursor-default transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center shadow-inner`}>
                        <Icon className={`w-5 h-5 ${colors.icon}`} />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500 font-semibold mt-1">{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Category Chart */}
              <motion.div variants={fadeUp} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Assets by Category</h3>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} width={80} />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Recent Assignments Table */}
              <motion.div variants={fadeUp} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-bold text-slate-900">Recent Assignments</h3>
                  <button className="text-[10px] font-bold text-brand-600 hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase">Asset</th>
                        <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase">Code</th>
                        <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase">Assigned To</th>
                        <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAssignments.map((req, i) => (
                        <tr key={i} className="border-b last:border-0 border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Monitor className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="text-xs font-bold text-slate-800">{req.asset}</span>
                            </div>
                          </td>
                          <td className="py-3"><span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{req.code}</span></td>
                          <td className="py-3">
                            <div>
                              <p className="text-xs font-bold text-slate-700">{req.to}</p>
                              <p className="text-[9px] text-slate-400 font-medium">{req.dept}</p>
                            </div>
                          </td>
                          <td className="py-3 text-right text-[10px] font-semibold text-slate-500">{req.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
            
          </motion.div>
        )}
      </div>
    </div>
  );
}
