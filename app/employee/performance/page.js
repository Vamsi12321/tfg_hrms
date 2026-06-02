"use client";

import { motion } from "framer-motion";
import { Target, TrendingUp, Award, Star, CheckCircle2, Clock } from "lucide-react";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function MyPerformancePage() {
  const { user } = useAuth();

  const performanceTrend = [
    { month: "Jan", score: 88 },
    { month: "Feb", score: 90 },
    { month: "Mar", score: 87 },
    { month: "Apr", score: 92 },
    { month: "May", score: 95 },
  ];

  const myOKRs = [
    {
      objective: "Deliver Project Alpha on time",
      keyResults: [
        { title: "Complete backend API by May 15", progress: 100 },
        { title: "Pass all integration tests", progress: 85 },
        { title: "Zero critical bugs in production", progress: 90 },
      ],
    },
    {
      objective: "Improve team velocity by 20%",
      keyResults: [
        { title: "Reduce PR review time to <4 hours", progress: 70 },
        { title: "Automate 3 manual processes", progress: 66 },
        { title: "Mentor 2 junior developers", progress: 50 },
      ],
    },
  ];

  const skills = [
    { name: "Technical Skills", score: 95 },
    { name: "Communication", score: 88 },
    { name: "Leadership", score: 82 },
    { name: "Problem Solving", score: 92 },
    { name: "Teamwork", score: 90 },
  ];

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Performance" />

      <div className="p-6 space-y-6">
        {/* Score Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Overall Score", value: "92%", icon: Target, color: "blue" },
            { label: "Rank", value: "#3", icon: Award, color: "amber" },
            { label: "Goals Completed", value: "7/10", icon: CheckCircle2, color: "green" },
            { label: "Review Due", value: "Jun 15", icon: Clock, color: "purple" },
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
                <Icon className={`w-5 h-5 text-${stat.color}-500 mb-2`} />
                <p className="text-xl font-black text-slate-900">{stat.value}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Performance Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Performance Trend</h3>
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                <TrendingUp className="w-3 h-3" /> +7% this quarter
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={performanceTrend}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[80, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2.5} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Skills Radar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900 mb-4">Skill Assessment</h3>
            <div className="space-y-3">
              {skills.map((skill, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-700 font-medium">{skill.name}</span>
                    <span className="text-xs font-bold text-slate-600">{skill.score}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.score}%` }}
                      transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }}
                      className={`h-full rounded-full ${
                        skill.score >= 90 ? "bg-green-500" : skill.score >= 80 ? "bg-blue-500" : "bg-amber-500"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* My OKRs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-bold text-slate-900 mb-4">My OKRs - Q2 2025</h3>
          <div className="space-y-4">
            {myOKRs.map((okr, i) => {
              const avgProgress = Math.round(okr.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / okr.keyResults.length);
              return (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <Target className="w-4 h-4 text-indigo-500" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{okr.objective}</h4>
                    </div>
                    <span className="text-sm font-black text-slate-700">{avgProgress}%</span>
                  </div>
                  <div className="space-y-3">
                    {okr.keyResults.map((kr, j) => (
                      <div key={j}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-600">{kr.title}</span>
                          <span className="text-xs font-bold text-slate-500">{kr.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${kr.progress}%` }}
                            transition={{ delay: 0.5 + j * 0.1, duration: 0.8 }}
                            className={`h-full rounded-full ${kr.progress === 100 ? "bg-green-500" : kr.progress >= 70 ? "bg-blue-500" : "bg-amber-500"}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
