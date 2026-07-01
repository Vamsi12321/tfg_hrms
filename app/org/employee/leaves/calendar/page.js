"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useHolidays } from "@/lib/queries";

export default function HolidayCalendarPage() {
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear,  setCalYear]  = useState(new Date().getFullYear());
  const { data: holidays = [], isLoading } = useHolidays({ year: calYear, limit: 200 });

  const holidayDates = {};
  holidays.forEach(h => { holidayDates[h.date] = h; });

  const prevMonth = () => { if (calMonth===0) { setCalMonth(11); setCalYear(y=>y-1); } else setCalMonth(m=>m-1); };
  const nextMonth = () => { if (calMonth===11) { setCalMonth(0); setCalYear(y=>y+1); } else setCalMonth(m=>m+1); };

  const monthHolidays = holidays.filter(h => {
    const d = new Date(h.date+"T00:00:00");
    return d.getMonth()===calMonth && d.getFullYear()===calYear;
  });

  if (isLoading) return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>;

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      {/* Holiday list */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Holidays — {new Date(calYear,calMonth).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</h3>
            <span className="text-[10px] text-slate-400">{monthHolidays.length} holidays</span>
          </div>
          <div className="p-3 space-y-2 max-h-[70vh] overflow-y-auto">
            {monthHolidays.length===0 ? (
              <div className="py-10 text-center"><CalendarDays className="w-8 h-8 text-slate-200 mx-auto mb-2"/><p className="text-xs text-slate-400">No holidays this month</p></div>
            ) : monthHolidays.map((h,i)=>(
              <motion.div key={h.id||i} initial={{opacity:0,x:-5}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
                className={`flex items-center gap-3 p-3 rounded-xl border ${h.type==="mandatory"?"bg-red-50/50 border-red-100":"bg-blue-50/50 border-blue-100"}`}>
                <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${h.type==="mandatory"?"bg-red-100":"bg-blue-100"}`}>
                  <span className={`text-[8px] font-bold leading-none ${h.type==="mandatory"?"text-red-500":"text-blue-500"}`}>{new Date(h.date+"T00:00:00").toLocaleDateString("en-US",{month:"short"}).toUpperCase()}</span>
                  <span className={`text-sm font-black leading-tight ${h.type==="mandatory"?"text-red-700":"text-blue-700"}`}>{new Date(h.date+"T00:00:00").getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">{h.name}</p>
                  <p className="text-[10px] text-slate-500">{new Date(h.date+"T00:00:00").toLocaleDateString("en-US",{weekday:"long"})}{h.state?` • ${h.state}`:""}</p>
                </div>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${h.type==="mandatory"?"bg-red-200/70 text-red-700":"bg-blue-200/70 text-blue-700"}`}>{h.type==="mandatory"?"Mandatory":"Optional"}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mini calendar */}
      <div className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-20">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <button onClick={prevMonth} className="w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center"><ChevronLeft className="w-3.5 h-3.5 text-slate-500"/></button>
            <span className="text-xs font-bold text-slate-800">{new Date(calYear,calMonth).toLocaleDateString("en-US",{month:"short",year:"numeric"})}</span>
            <button onClick={nextMonth} className="w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center"><ChevronRight className="w-3.5 h-3.5 text-slate-500"/></button>
          </div>
          <div className="p-2.5">
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {["S","M","T","W","T","F","S"].map((d,i)=><div key={i} className="text-center text-[8px] font-bold text-slate-400 py-0.5">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({length:new Date(calYear,calMonth,1).getDay()}).map((_,i)=><div key={`e-${i}`}/>)}
              {Array.from({length:new Date(calYear,calMonth+1,0).getDate()}).map((_,i)=>{
                const day=i+1;
                const dateStr=`${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const holiday=holidayDates[dateStr];
                const isToday=new Date().getFullYear()===calYear&&new Date().getMonth()===calMonth&&new Date().getDate()===day;
                return (
                  <div key={day} title={holiday?.name||""}
                    className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-medium cursor-default
                      ${holiday?.type==="mandatory"?"bg-red-100 text-red-700 font-bold":""}
                      ${holiday?.type==="optional"?"bg-blue-100 text-blue-700 font-bold":""}
                      ${!holiday?"text-slate-600":""}
                      ${isToday?"ring-1 ring-brand-500":""}
                    `}>{day}</div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1 text-[8px] text-slate-500"><span className="w-2 h-2 rounded-sm bg-red-100"/>Mandatory</span>
              <span className="flex items-center gap-1 text-[8px] text-slate-500"><span className="w-2 h-2 rounded-sm bg-blue-100"/>Optional</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
