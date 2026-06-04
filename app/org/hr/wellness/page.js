"use client";

import { motion } from "framer-motion";
import {
  Heart, Smile, Meh, Frown, TrendingUp, TrendingDown,
  Brain, Coffee, Sun, Moon, Activity, Users, AlertTriangle
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { employees } from "@/lib/fakeData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function WellnessPage() {
  const moodData = [
    { day: "Mon", happy: 8, neutral: 3, stressed: 1 },
    { day: "Tue", happy: 7, neutral: 4, stressed: 1 },
    { day: "Wed", happy: 9, neutral: 2, stressed: 1 },
    { day: "Thu", happy: 6, neutral: 4, stressed: 2 },
    { day: "Fri", happy: 10, neutral: 1, stressed: 1 },
  ];

  const moodCounts = {
    happy: employees.filter(e => e.mood === "happy").length,
    neutral: employees.filter(e => e.mood === "neutral").length,
    stressed: employees.filter(e => e.mood === "stressed").length,
  };

  const wellnessScore = 78;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Wellness & Mood Tracker" />

      <div className="p-6 space-y-6">
        {/* Wellness Score */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5" />
                <span className="text-sm font-medium text-emerald-100">Organization Wellness Score</span>
              </div>
              <p className="text-4xl font-black">{wellnessScore}/100</p>
              <p className="text-sm text-emerald-100 mt-1">+5 points from last month</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-emerald-100 mb-1">This feature is unique to TFG</p>
              <p className="text-xs text-emerald-200">No competitor offers AI-powered mood tracking</p>
            </div>
          </div>
        </motion.div>

        {/* Mood Overview */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Happy", count: moodCounts.happy, icon: Smile, color: "green", percentage: Math.round((moodCounts.happy / employees.length) * 100) },
            { label: "Neutral", count: moodCounts.neutral, icon: Meh, color: "amber", percentage: Math.round((moodCounts.neutral / employees.length) * 100) },
            { label: "Stressed", count: moodCounts.stressed, icon: Frown, color: "red", percentage: Math.round((moodCounts.stressed / employees.length) * 100) },
          ].map((mood, i) => {
            const Icon = mood.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center"
              >
                <div className={`w-12 h-12 rounded-full bg-${mood.color}-50 flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`w-6 h-6 text-${mood.color}-500`} />
                </div>
                <p className="text-2xl font-black text-slate-900">{mood.count}</p>
                <p className="text-xs text-slate-500 font-medium">{mood.label} ({mood.percentage}%)</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Mood Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900 mb-4">Weekly Mood Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={moodData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="happy" stackId="mood" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="neutral" stackId="mood" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="stressed" stackId="mood" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> Happy</span>
              <span className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Neutral</span>
              <span className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Stressed</span>
            </div>
          </motion.div>

          {/* Wellness Initiatives */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900 mb-4">Active Wellness Programs</h3>
            <div className="space-y-3">
              {[
                { name: "Mental Health Support", desc: "Free counseling sessions", participation: 65, icon: Brain, color: "purple" },
                { name: "Fitness Challenge", desc: "10K steps daily challenge", participation: 45, icon: Activity, color: "green" },
                { name: "Mindfulness Mondays", desc: "Guided meditation at 9 AM", participation: 30, icon: Sun, color: "amber" },
                { name: "No-Meeting Fridays", desc: "Focus time for deep work", participation: 90, icon: Coffee, color: "blue" },
              ].map((program, i) => {
                const Icon = program.icon;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className={`w-9 h-9 rounded-xl bg-${program.color}-50 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 text-${program.color}-500`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{program.name}</p>
                      <p className="text-[10px] text-slate-400">{program.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-700">{program.participation}%</p>
                      <p className="text-[9px] text-slate-400">Participation</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Employees needing attention */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Employees Needing Attention</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {employees.filter(e => e.mood === "stressed").map((emp, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-red-50/50 border border-red-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white font-bold text-xs">
                  {emp.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                  <p className="text-xs text-slate-500">{emp.department} • {emp.designation}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Frown className="w-4 h-4 text-red-400" />
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
