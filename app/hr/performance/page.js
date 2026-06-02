"use client";

import { motion } from "framer-motion";
import { Target, TrendingUp, Award, ChevronRight, Star } from "lucide-react";
import TopBar from "@/components/TopBar";
import { okrs, employees } from "@/lib/fakeData";

export default function PerformancePage() {
  const topPerformers = [...employees].sort((a, b) => b.performance - a.performance).slice(0, 5);

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Performance & OKRs" />

      <div className="p-6 space-y-6">
        {/* OKR Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Objectives & Key Results</h2>
              <p className="text-xs text-slate-500">Q2 2025 • Company-wide OKRs</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20"
            >
              <Target className="w-4 h-4" /> New OKR
            </motion.button>
          </div>

          <div className="space-y-4">
            {okrs.map((okr, i) => {
              const avgProgress = Math.round(okr.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / okr.keyResults.length);
              return (
                <motion.div
                  key={okr.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{okr.objective}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Owner: {okr.owner} • {okr.quarter}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-slate-900">{avgProgress}%</p>
                      <p className="text-[10px] text-slate-400">Overall</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {okr.keyResults.map((kr, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-700 font-medium">{kr.title}</span>
                            <span className="text-xs font-bold text-slate-600">{kr.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${kr.progress}%` }}
                              transition={{ delay: 0.5 + j * 0.15, duration: 0.8 }}
                              className={`h-full rounded-full ${
                                kr.progress >= 80 ? "bg-green-500" :
                                kr.progress >= 50 ? "bg-blue-500" :
                                "bg-amber-500"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Top Performers</h3>
          </div>
          <div className="grid sm:grid-cols-5 gap-4">
            {topPerformers.map((emp, i) => (
              <motion.div
                key={emp.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="text-center p-4 rounded-xl bg-gradient-to-b from-slate-50 to-white border border-slate-100"
              >
                <div className="relative inline-block mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm mx-auto">
                    {emp.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  {i === 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-800">{emp.name.split(" ")[0]}</p>
                <p className="text-[10px] text-slate-400">{emp.department}</p>
                <p className="text-sm font-black text-brand-600 mt-1">{emp.performance}%</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
