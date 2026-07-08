"use client";

import { useState } from "react";
import { useMonthlyAttendanceReport } from "@/lib/queries";
import { FileBarChart2, Calendar, Download, Search } from "lucide-react";
import { motion } from "framer-motion";
import ExportButton from "@/components/ExportButton";

const MONTHS = Array.from({length:12},(_,i)=>({value:i+1,label:new Date(2025,i).toLocaleDateString("en-US",{month:"long"})}));
const YEARS  = [2024,2025,2026,2027];

export default function AttendanceReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth()+1);
  const [year,  setYear]  = useState(now.getFullYear());

  const { data: report, isLoading } = useMonthlyAttendanceReport({ month, year });
  const [searchQuery, setSearchQuery] = useState("");

  const currentMonthLabel = MONTHS.find(m=>m.value===month)?.label;
  
  const filteredDepartments = (report?.departments || []).filter(d => 
    (d.department || "Unassigned").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Attendance Report</h3>
          <p className="text-sm text-slate-500">Monthly departmental summary</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 w-full max-w-[200px] focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/15 transition-all shadow-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search department..." className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full" />
          </div>
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400 ml-3 mr-1" />
            <select value={month} onChange={e=>setMonth(parseInt(e.target.value))}
              className="px-2 py-1.5 text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer">
              {MONTHS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <span className="w-px h-4 bg-slate-200 mx-1" />
            <select value={year} onChange={e=>setYear(parseInt(e.target.value))}
              className="px-2 py-1.5 text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer">
              {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          
          {filteredDepartments.length > 0 && (
            <ExportButton 
              data={report.departments}
              filename={`Attendance_Report_${currentMonthLabel}_${year}.csv`}
              columns={[
                { header: "Department", key: "department" },
                { header: "Present Days", key: "present_days" },
                { header: "Absent Days", key: "absent_days" },
                { header: "Late Days", key: "late_days" },
                { header: "Total Hours", key: "total_hours" }
              ]}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
            />
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      ) : filteredDepartments.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50/60">
                {["Department","Present Days","Absent Days","Late Days","Total Hours"].map(h=>
                  <th key={h} className="text-left text-[10px] font-bold text-indigo-700 uppercase tracking-wider px-6 py-4 whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filteredDepartments.map((d,i)=>(
                  <motion.tr initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-800">{d.department || "Unassigned"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100/50">
                        {d.present_days}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100/50">
                        {d.absent_days}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100/50">
                        {d.late_days}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-700">{d.total_hours}<span className="text-xs font-semibold text-slate-400 ml-1">hrs</span></span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-16 border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileBarChart2 className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-600">{searchQuery ? "No matching departments found" : "No report data found"}</p>
          <p className="text-xs font-medium text-slate-400 mt-1">{searchQuery ? "Try adjusting your search query." : `There are no attendance records for ${currentMonthLabel} ${year}.`}</p>
        </div>
      )}
    </div>
  );
}
