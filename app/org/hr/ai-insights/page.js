"use client";

import { motion } from "framer-motion";
import {
  Brain, AlertTriangle, TrendingUp, Activity, Sparkles,
  Users, Heart, Shield, Lightbulb, ArrowRight, Zap
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { aiInsights, employees } from "@/lib/fakeData";

export default function AIInsightsPage() {
  const severityConfig = {
    high: { bg: "bg-red-50", border: "border-red-200", icon: AlertTriangle, iconColor: "text-red-500", badge: "bg-red-100 text-red-700" },
    positive: { bg: "bg-green-50", border: "border-green-200", icon: TrendingUp, iconColor: "text-green-500", badge: "bg-green-100 text-green-700" },
    medium: { bg: "bg-amber-50", border: "border-amber-200", icon: Activity, iconColor: "text-amber-500", badge: "bg-amber-100 text-amber-700" },
    info: { bg: "bg-blue-50", border: "border-blue-200", icon: Lightbulb, iconColor: "text-blue-500", badge: "bg-blue-100 text-blue-700" },
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="AI Insights" />

      <div className="p-6 space-y-6">
        {/* AI Engine Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 text-white shadow-xl"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 flex items-start gap-4">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 flex-shrink-0"
            >
              <Brain className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold mb-1">TFG Intelligence Engine</h2>
              <p className="text-blue-100 text-sm max-w-lg">
                Our AI continuously analyzes employee patterns, sentiment, workload, and performance to surface actionable insights before problems arise.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-blue-200">
                  <Zap className="w-3.5 h-3.5" /> Real-time Analysis
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-blue-200">
                  <Shield className="w-3.5 h-3.5" /> Predictive Alerts
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-blue-200">
                  <Heart className="w-3.5 h-3.5" /> Wellness Monitoring
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Alerts", value: "3", color: "red", icon: AlertTriangle },
            { label: "Positive Signals", value: "5", color: "green", icon: TrendingUp },
            { label: "Predictions Made", value: "24", color: "purple", icon: Brain },
            { label: "Actions Taken", value: "18", color: "blue", icon: Sparkles },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
              >
                <Icon className={`w-5 h-5 text-${stat.color}-500 mb-2`} />
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                <p className="text-[10px] text-slate-500 font-medium">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Insights List */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Latest Insights</h3>
          <div className="space-y-4">
            {aiInsights.map((insight, i) => {
              const config = severityConfig[insight.severity];
              const Icon = config.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  whileHover={{ x: 4 }}
                  className={`${config.bg} rounded-2xl p-5 border ${config.border} cursor-pointer group`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${config.badge} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-slate-900">{insight.title}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${config.badge}`}>
                          {insight.severity}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{insight.description}</p>
                      {insight.employee && (
                        <div className="flex items-center gap-2 mt-3">
                          <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-white text-[8px] font-bold">
                            {insight.employee.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span className="text-xs text-slate-500 font-medium">{insight.employee}</span>
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 mt-1" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">AI Recommendations</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { title: "Schedule 1-on-1 with Sneha", desc: "Declining engagement detected", priority: "High" },
              { title: "Promote Vikram Singh", desc: "Consistent top performer for 6 months", priority: "Medium" },
              { title: "Hire 2 Frontend Devs", desc: "Project pipeline requires more capacity", priority: "Medium" },
              { title: "Team Building - Marketing", desc: "Mood scores dropped 20%", priority: "High" },
              { title: "Review Workload - Engineering", desc: "15% above average hours logged", priority: "Medium" },
              { title: "Update Remote Policy", desc: "WFH requests up 40% this quarter", priority: "Low" },
            ].map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.05 }}
                className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    rec.priority === "High" ? "bg-red-100 text-red-600" :
                    rec.priority === "Medium" ? "bg-amber-100 text-amber-600" :
                    "bg-slate-200 text-slate-600"
                  }`}>{rec.priority}</span>
                </div>
                <p className="text-xs font-bold text-slate-800">{rec.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{rec.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
