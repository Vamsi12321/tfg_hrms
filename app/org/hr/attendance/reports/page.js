"use client";

import { useState } from "react";
import { useMonthlyAttendanceReport } from "@/lib/queries";

const MONTHS = Array.from({length:12},(_,i)=>({value:i+1,label:new Date(2025,i).toLocaleDateString("en-US",{month:"long"})}));
const YEARS  = [2024,2025,2026,2027];

export default function AttendanceReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth()+1);
  const [year,  setYear]  = useState(now.getFullYear());

  const { data: report, isLoading } = useMonthlyAttendanceReport({ month, year });

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
      ) : report?.departments ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50/80">
                {["Department","Present Days","Absent Days","Late Days","Total Hours"].map(h=>
                  <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-3 whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {report.departments.map((d,i)=>(
                  <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{d.department}</td>
                    <td className="px-4 py-2.5 text-xs font-bold text-green-600">{d.present_days}</td>
                    <td className="px-4 py-2.5 text-xs font-bold text-red-500">{d.absent_days}</td>
                    <td className="px-4 py-2.5 text-xs text-amber-600">{d.late_days}</td>
                    <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{d.total_hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <p className="text-sm font-semibold text-slate-400">No report data for {MONTHS.find(m=>m.value===month)?.label} {year}</p>
        </div>
      )}
    </div>
  );
}
