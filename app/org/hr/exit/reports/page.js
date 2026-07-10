"use client";

import { motion } from "framer-motion";
import { UserMinus, TrendingDown, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useExitReportSummary } from "@/lib/queries";

export default function ExitReportsPage() {
  const { data: summary, isLoading } = useExitReportSummary();

  if (isLoading) return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>;
  if (!summary) return <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center"><p className="text-sm text-slate-400">No data</p></div>;

  const stats = [
    { label:"Total Exits", value:summary.total||0, icon:UserMinus, bg:"bg-slate-50", ic:"text-slate-600" },
    { label:"Submitted", value:summary.submitted||0, icon:Clock, bg:"bg-amber-50", ic:"text-amber-600" },
    { label:"In Progress", value:summary.in_progress||0, icon:TrendingDown, bg:"bg-blue-50", ic:"text-blue-600" },
    { label:"Completed", value:summary.completed||0, icon:CheckCircle2, bg:"bg-green-50", ic:"text-green-600" },
    { label:"Rejected", value:summary.rejected||0, icon:XCircle, bg:"bg-red-50", ic:"text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s,i)=>{
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}><Icon className={`w-5 h-5 ${s.ic}`}/></div>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* By Type */}
      {summary.by_type&&Object.keys(summary.by_type).length>0&&(
        <motion.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:0.25}}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Exits by Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(summary.by_type).map(([type,count])=>(
              <div key={type} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-lg font-black text-slate-800">{count}</p>
                <p className="text-[10px] font-semibold text-slate-500 capitalize">{type}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top Reasons */}
      {summary.top_reasons&&summary.top_reasons.length>0&&(
        <motion.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:0.35}}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Top Exit Reasons</h3>
          <div className="space-y-3">
            {summary.top_reasons.map((r,i)=>(
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-700">{r.reason}</span>
                <span className="text-sm font-black text-brand-600">{r.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
