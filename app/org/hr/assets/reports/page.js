"use client";

import { motion } from "framer-motion";
import { Package, UserCheck, Wrench, AlertTriangle, RotateCcw, Archive } from "lucide-react";
import { useAssetSummary } from "@/lib/queries";

export default function AssetReportsPage() {
  const { data: summary, isLoading } = useAssetSummary();

  if (isLoading) return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>;
  if (!summary) return <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center"><p className="text-sm text-slate-400">No data available</p></div>;

  const stats = [
    { label:"Total Assets", value:summary.total||0, icon:Package, bg:"bg-blue-50", ic:"text-blue-600" },
    { label:"Assigned", value:summary.assigned||0, icon:UserCheck, bg:"bg-emerald-50", ic:"text-emerald-600" },
    { label:"Available", value:summary.available||0, icon:Package, bg:"bg-green-50", ic:"text-green-600" },
    { label:"Maintenance", value:summary.maintenance||0, icon:Wrench, bg:"bg-amber-50", ic:"text-amber-600" },
    { label:"Damaged", value:summary.damaged||0, icon:AlertTriangle, bg:"bg-red-50", ic:"text-red-600" },
    { label:"Retired", value:summary.retired||0, icon:Archive, bg:"bg-slate-50", ic:"text-slate-600" },
    { label:"Return Requested", value:summary.return_requested||0, icon:RotateCcw, bg:"bg-purple-50", ic:"text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map((s,i)=>{
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${s.ic}`}/>
              </div>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* By Category */}
      {summary.by_category && Object.keys(summary.by_category).length > 0 && (
        <motion.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Assets by Category</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(summary.by_category).map(([cat, count],i)=>(
              <div key={cat} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-lg font-black text-slate-800">{count}</p>
                <p className="text-[10px] font-semibold text-slate-500 capitalize">{cat.replace(/_/g," ")}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
