"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
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

  // client-side search + pagination (summary endpoint returns all for month)
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

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={month} onChange={e=>{ setMonth(parseInt(e.target.value)); setPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-brand-400">
          {MONTHS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={year} onChange={e=>{ setYear(parseInt(e.target.value)); setPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-brand-400">
          {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex-1 max-w-xs focus-within:border-brand-400">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0"/>
          <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}
            placeholder="Search employee or dept..." className="bg-transparent text-sm placeholder:text-slate-400 outline-none w-full"/>
        </div>
        {filtered.length > 0 && (
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold shadow-md ml-auto">
            <Download className="w-3.5 h-3.5"/> Export Excel
          </motion.button>
        )}
      </div>

      {/* Count */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-slate-500">{filtered.length} employees</p>
      )}

      {isLoading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      ) : filtered.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <p className="text-sm font-semibold text-slate-400">
            {search ? "No employees match your search" : `No data for ${MONTHS.find(m=>m.value===month)?.label} ${year}`}
          </p>
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
                {paged.map((s,i)=>(
                  <motion.tr key={i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}}
                    className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-semibold text-slate-800">{s.employee_name}</p>
                      {s.employee_code && <p className="text-[10px] text-slate-400">{s.employee_code}</p>}
                    </td>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">Page {page} of {totalPages} ({filtered.length} employees)</p>
              <div className="flex items-center gap-2">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4 text-slate-500"/>
                </button>
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4 text-slate-500"/>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
