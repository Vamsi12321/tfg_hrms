"use client";

import { motion } from "framer-motion";
import { Megaphone, Plus, Calendar, AlertCircle, Info, Bell } from "lucide-react";
import TopBar from "@/components/TopBar";
import { announcements } from "@/lib/fakeData";

export default function AnnouncementsPage() {
  const priorityConfig = {
    high: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", icon: AlertCircle },
    medium: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", icon: Bell },
    low: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", icon: Info },
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Announcements" />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Company Announcements</h2>
            <p className="text-sm text-slate-500">Keep your team informed with important updates</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" /> New Announcement
          </motion.button>
        </div>

        <div className="space-y-4">
          {announcements.map((ann, i) => {
            const config = priorityConfig[ann.priority];
            const Icon = config.icon;
            return (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ x: 4 }}
                className={`${config.bg} rounded-2xl p-6 border ${config.border} cursor-pointer`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${config.badge} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900">{ann.title}</h3>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${config.badge}`}>
                        {ann.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{ann.content}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">{ann.date}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
