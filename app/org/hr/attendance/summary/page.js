"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, ChevronLeft, ChevronRight, Calendar, Users, Calculator } from "lucide-react";
import { useAttendanceSummary } from "@/lib/queries";
import { downloadCSV, EXPORT_CONFIGS } from "@/lib/excel";

const MONTHS = Array.from({length:12},(_,i)=>({value:i+1,label:new Date(2025,i).toLocaleDateString("en-US",{month:"long"})}));
const YEARS  = [2024,2025,2026,2027];
const PAGE_SIZE = 20;

export default function AttendanceSummaryPage() {
  const now = new Date();
  const [month,  setMonth]  = useState(now.getMonth()+1);
  const [year,   setYear]   = useState(now.getFullYear());
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);

  const { data: allSummary = [], isLoading } = useAttendanceSummary({ month, year });

  // client-side search + pagination
  const filtered = allSummary.filter(s =>
    !search || s.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    downloadCSV(
      filtered,
      EXPORT_CONFIGS.attendance_summary,
      `attendance_summary_${MONTHS.find(m=>m.value===month)?.label}_${year}.csv`
    );
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const p = name.split(" ");
    if (p.length >= 2) return p[0][0] + p[1][0];
    return name.substring(0,2).toUpperCase();
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Employee Summary</h3>
          <p className="text-sm text-slate-500">Monthly attendance breakdown per employee</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400 ml-3 mr-1" />
            <select value={month} onChange={e=>{ setMonth(parseInt(e.target.value)); setPage(1); }}
              className="px-2 py-1.5 text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer">
              {MONTHS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <span className="w-px h-4 bg-slate-200 mx-1" />
            <select value={year} onChange={e=>{ setYear(parseInt(e.target.value)); setPage(1); }}
              className="px-2 py-1.5 text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer">
              {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all shadow-sm flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0"/>
            <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}
              placeholder="Search employee or dept..." className="bg-transparent text-sm font-semibold placeholder:text-slate-400 outline-none w-full"/>
          </div>
          {filtered.length > 0 && (
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors ml-auto">
              <Download className="w-4 h-4"/> Export CSV
            </motion.button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      ) : filtered.length===0 ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-600">
            {search ? "No employees match your search" : `No data for ${MONTHS.find(m=>m.value===month)?.label} ${year}`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Calculator className="w-4 h-4 text-brand-600"/> Summary Table</h3>
            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{filtered.length} employees</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50/60">
                {["Employee","Present","Absent","Half Day","Late","Leaves","Avg Hrs"].map(h=>
                  <th key={h} className="text-left text-[10px] font-bold text-indigo-700 uppercase tracking-wider px-6 py-4 whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {paged.map((s,i)=>(
                  <motion.tr key={i} initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} transition={{delay:i*0.02}}
                    className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-600">
                          {getInitials(s.employee_name)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{s.employee_name}</p>
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5">{s.department || "No Dept"} {s.employee_code && `· ${s.employee_code}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100/50">
                        {s.present}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100/50">
                        {s.absent}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100/50">
                        {s.half_days||0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100/50">
                        {s.late_arrivals||0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100/50">
                        {s.leaves||0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.avg_hours ? (
                        <span className="text-sm font-black text-slate-700">{s.avg_hours.toFixed(1)}<span className="text-xs font-semibold text-slate-400 ml-0.5">h</span></span>
                      ) : (
                        <span className="text-sm font-bold text-slate-300">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-xs font-semibold text-slate-500">Showing page <span className="text-slate-900">{page}</span> of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm">
                  <ChevronLeft className="w-4 h-4 text-slate-600"/>
                </button>
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm">
                  <ChevronRight className="w-4 h-4 text-slate-600"/>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
