"use client";

import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Users, Clock, Wallet,
  ArrowUpRight, ArrowDownRight, Target
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { employees, departments, monthlyAttendanceData, headcountTrend } from "@/lib/fakeData";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

export default function AnalyticsPage() {
  const attritionData = [
    { month: "Jan", rate: 2.1 },
    { month: "Feb", rate: 1.8 },
    { month: "Mar", rate: 2.5 },
    { month: "Apr", rate: 1.2 },
    { month: "May", rate: 0.8 },
  ];

  const deptPerformance = departments.map(d => ({
    name: d.name.substring(0, 6),
    score: Math.floor(Math.random() * 20) + 75,
  }));

  const costPerHire = [
    { month: "Jan", cost: 45000 },
    { month: "Feb", cost: 42000 },
    { month: "Mar", cost: 38000 },
    { month: "Apr", cost: 35000 },
    { month: "May", cost: 32000 },
  ];

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Analytics" />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Attrition Rate", value: "0.8%", change: "-0.4%", up: false, good: true, icon: Users },
            { label: "Avg Time to Hire", value: "18 days", change: "-3 days", up: false, good: true, icon: Clock },
            { label: "Cost per Hire", value: "₹32K", change: "-29%", up: false, good: true, icon: Wallet },
            { label: "eNPS Score", value: "62", change: "+8", up: true, good: true, icon: Target },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className="w-5 h-5 text-brand-500" />
                  <span className={`flex items-center gap-0.5 text-[10px] font-bold ${kpi.good ? "text-green-600" : "text-red-600"}`}>
                    {kpi.good ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {kpi.change}
                  </span>
                </div>
                <p className="text-xl font-black text-slate-900">{kpi.value}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{kpi.label}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Attrition Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Attrition Rate Trend</h3>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Improving ↓</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={attritionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} unit="%" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Line type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: "#ef4444", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Cost per Hire */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Cost per Hire</h3>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">-29% YTD</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={costPerHire}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} formatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                <Area type="monotone" dataKey="cost" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Department Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900 mb-4">Department Performance Scores</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptPerformance}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[60, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="score" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Headcount Growth */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Headcount Growth</h3>
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                <ArrowUpRight className="w-3 h-3" /> +33%
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={headcountTrend}>
                <defs>
                  <linearGradient id="colorHead" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Area type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2.5} fill="url(#colorHead)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
