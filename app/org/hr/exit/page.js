"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserMinus, CheckSquare, Clock, Users, ArrowRight, XCircle, Search, Filter, CalendarX, FileText } from "lucide-react";
import TopBar from "@/components/TopBar";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

export default function ExitManagementDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock Data
  const stats = [
    { label: "Pending Resignations", value: 3, icon: Clock, color: "amber" },
    { label: "On Notice Period", value: 8, icon: CalendarX, color: "blue" },
    { label: "Pending Clearances", value: 12, icon: CheckSquare, color: "purple" },
    { label: "Attrition Rate (YTD)", value: "4.2%", icon: UserMinus, color: "red" },
  ];

  const colorMap = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600" },
    red: { bg: "bg-red-50", icon: "text-red-600" },
  };

  const attritionData = [
    { month: "Jan", count: 2 },
    { month: "Feb", count: 1 },
    { month: "Mar", count: 3 },
    { month: "Apr", count: 2 },
    { month: "May", count: 5 },
    { month: "Jun", count: 2 },
  ];

  const noticePeriodEmployees = [
    { name: "Alice Wonderland", code: "EMP011", dept: "Design", lwd: "15 Jul 2026", progress: 85 },
    { name: "Bob Builder", code: "EMP052", dept: "Engineering", lwd: "28 Jul 2026", progress: 60 },
    { name: "Charlie Chaplin", code: "EMP109", dept: "Sales", lwd: "10 Aug 2026", progress: 30 },
  ];

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Exit Management" />

      <div className="p-4 md:p-6 space-y-6">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            {["overview", "resignations", "clearance", "interviews", "settlements"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                  activeTab === tab ? "bg-brand-50 text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 shadow-sm transition-all">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 shadow-sm transition-all">
              <UserMinus className="w-3.5 h-3.5" /> Initiate Exit
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
              
              {/* Attrition Trend */}
              <motion.div variants={fadeUp} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Attrition Trends (Last 6 Months)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attritionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 2 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* On Notice Period */}
              <motion.div variants={fadeUp} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-bold text-slate-900">Serving Notice Period</h3>
                  <button className="text-[10px] font-bold text-brand-600 hover:underline">View All</button>
                </div>
                <div className="space-y-5">
                  {noticePeriodEmployees.map((emp, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{emp.name}</p>
                          <p className="text-[9px] font-semibold text-slate-400">{emp.dept}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-slate-500">LWD</p>
                          <p className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md mt-0.5">{emp.lwd}</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${emp.progress}%` }} transition={{ duration: 1, delay: 0.2 }}
                          className={`h-full rounded-full ${emp.progress > 80 ? 'bg-red-500' : emp.progress > 50 ? 'bg-amber-500' : 'bg-blue-500'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-colors">
                    <FileText className="w-3.5 h-3.5" /> Start Clearances
                  </button>
                </div>
              </motion.div>
            </div>
            
          </motion.div>
        )}
      </div>
    </div>
  );
}
