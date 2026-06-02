"use client";

import { motion } from "framer-motion";
import {
  CalendarCheck, Clock, Target, TrendingUp, Wallet,
  FileText, Bell, CheckCircle2, Smile, Coffee, Sun,
  ArrowRight, Sparkles, Heart
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";
import { announcements, holidays } from "@/lib/fakeData";

export default function MyDashboardPage() {
  const { user } = useAuth();

  // Fake employee-specific data
  const myStats = {
    attendance: 96,
    leaveBalance: 13,
    pendingLeaves: 1,
    performanceScore: 92,
    currentStreak: 12,
    mood: "happy",
  };

  const myTasks = [
    { title: "Complete Q2 self-assessment", due: "May 28", priority: "high", done: false },
    { title: "Upload updated ID proof", due: "May 30", priority: "medium", done: false },
    { title: "Review team OKR progress", due: "Jun 1", priority: "low", done: false },
    { title: "Complete compliance training", due: "May 20", priority: "high", done: true },
  ];

  const todaySchedule = [
    { time: "09:00 AM", event: "Check-in", type: "attendance" },
    { time: "10:00 AM", event: "Sprint Planning", type: "meeting" },
    { time: "02:00 PM", event: "1-on-1 with Manager", type: "meeting" },
    { time: "04:30 PM", event: "Team Standup", type: "meeting" },
    { time: "06:00 PM", event: "Check-out", type: "attendance" },
  ];

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Dashboard" />

      <div className="p-6 space-y-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-6 text-white shadow-xl"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Sun className="w-5 h-5 text-yellow-200" />
              <span className="text-sm font-medium text-green-100">Good Morning!</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Hey, {user?.name?.split(" ")[0]} 👋</h2>
            <p className="text-green-100 text-sm">You&apos;re on a {myStats.currentStreak}-day attendance streak! Keep it up.</p>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Attendance", value: `${myStats.attendance}%`, icon: CalendarCheck, color: "green" },
            { label: "Leave Balance", value: `${myStats.leaveBalance} days`, icon: Clock, color: "blue" },
            { label: "Performance", value: `${myStats.performanceScore}%`, icon: Target, color: "purple" },
            { label: "Streak", value: `${myStats.currentStreak} days`, icon: TrendingUp, color: "amber" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
              >
                <Icon className={`w-5 h-5 text-${stat.color}-500 mb-2`} />
                <p className="text-xl font-black text-slate-900">{stat.value}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900 mb-4">Today&apos;s Schedule</h3>
            <div className="space-y-3">
              {todaySchedule.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-mono text-slate-400 w-16">{item.time}</span>
                  <div className={`w-2 h-2 rounded-full ${item.type === "meeting" ? "bg-brand-400" : "bg-green-400"}`} />
                  <span className="text-sm font-medium text-slate-700">{item.event}</span>
                  <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    item.type === "meeting" ? "bg-brand-50 text-brand-600" : "bg-green-50 text-green-600"
                  }`}>{item.type}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* My Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900 mb-4">My Tasks</h3>
            <div className="space-y-2.5">
              {myTasks.map((task, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${task.done ? "bg-green-50/50 border-green-100" : "border-slate-100 hover:bg-slate-50"} transition-colors`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    task.done ? "border-green-500 bg-green-500" : "border-slate-300"
                  }`}>
                    {task.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${task.done ? "text-slate-400 line-through" : "text-slate-800"}`}>{task.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Due: {task.due}</p>
                  </div>
                  {!task.done && (
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                      task.priority === "high" ? "bg-red-100 text-red-600" :
                      task.priority === "medium" ? "bg-amber-100 text-amber-600" :
                      "bg-slate-100 text-slate-500"
                    }`}>{task.priority}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Mood Check-in & Announcements */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Mood Check-in */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100"
          >
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-purple-500" />
              <h3 className="text-sm font-bold text-slate-900">How are you feeling today?</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Your responses are anonymous and help us improve workplace wellness.</p>
            <div className="flex items-center gap-3">
              {[
                { emoji: "😊", label: "Great", bg: "bg-green-100 hover:bg-green-200 border-green-200" },
                { emoji: "🙂", label: "Good", bg: "bg-blue-100 hover:bg-blue-200 border-blue-200" },
                { emoji: "😐", label: "Okay", bg: "bg-amber-100 hover:bg-amber-200 border-amber-200" },
                { emoji: "😔", label: "Low", bg: "bg-orange-100 hover:bg-orange-200 border-orange-200" },
                { emoji: "😫", label: "Stressed", bg: "bg-red-100 hover:bg-red-200 border-red-200" },
              ].map((mood, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border ${mood.bg} transition-colors cursor-pointer`}
                >
                  <span className="text-xl">{mood.emoji}</span>
                  <span className="text-[9px] font-medium text-slate-600">{mood.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Latest Announcements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-bold text-slate-900">Announcements</h3>
            </div>
            <div className="space-y-3">
              {announcements.slice(0, 3).map((ann, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-800">{ann.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{ann.date}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Upcoming Holidays */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <h3 className="text-sm font-bold text-slate-900 mb-4">Upcoming Holidays</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {holidays.map((h, i) => (
              <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-center">
                <p className="text-sm font-bold text-slate-800">{h.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{h.date}</p>
                <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full mt-2 inline-block">{h.type}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
