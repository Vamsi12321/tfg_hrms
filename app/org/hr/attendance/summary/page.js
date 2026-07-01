"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAttendanceSummary } from "@/lib/queries";

const MONTHS = Array.from({length:12},(_,i)=>({value:i+1,label:new Date(2025,i).toLocaleDateString("en-US",{month:"long"})}));
const YEARS  = [2024,2025,2026,2027];

export default function AttendanceSummaryPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth()+1);
  const [year,  setYear]  = useState(now.getFullYear());

  const { data: summary = [], isLoading } = useAttendanceSummary({ month, year });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={month} onChange={e=>setMonth(parseInt(e.target.value))}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-brand-400">
          {MONTHS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={year} onChange={e=>setYear(parseInt(e.target.value))}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-brand-400">
          {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      ) : summary.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <p className="text-sm font-semibold text-slate-400">No data for {MONTHS.find(m=>m.value===month)?.label} {year}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50/80">
                {["Employee","Dept","Present","Absent","Half Day","Late","Leaves","Avg Hrs"].map(h=>
                  <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-3 whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {summary.map((s,i)=>(
                  <motion.tr key={i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}}
                    className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{s.employee_name}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{s.department}</td>
                    <td className="px-4 py-2.5 text-xs font-bold text-green-600">{s.present}</td>
                    <td className="px-4 py-2.5 text-xs font-bold text-red-500">{s.absent}</td>
                    <td className="px-4 py-2.5 text-xs text-orange-600">{s.half_days||0}</td>
                    <td className="px-4 py-2.5 text-xs text-amber-600">{s.late_arrivals||0}</td>
                    <td className="px-4 py-2.5 text-xs text-purple-600">{s.leaves||0}</td>
                    <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{s.avg_hours?.toFixed(1)||"—"}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
