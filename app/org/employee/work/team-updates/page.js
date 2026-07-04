"use client";

import { todayIST } from "@/lib/date";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, CheckCircle2, Calendar, AlertTriangle } from "lucide-react";
import { useTeamDailyUpdates } from "@/lib/queries";

export default function TeamUpdatesPage() {
  const [date, setDate] = useState(todayIST());
  const { data: updData, isLoading } = useTeamDailyUpdates({ date });
  const updates = updData?.updates || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-brand-400"/>
        <p className="text-xs text-slate-500">{updates.length} update{updates.length!==1?"s":""} from your team</p>
      </div>

      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : updates.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">No team updates for {new Date(date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"})}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map((u,i)=>{
            const initials = (u.employee_name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
            const hasBlocker = u.blockers && u.blockers.trim().length > 0;
            return (
              <motion.div key={u.id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                className={`bg-white rounded-2xl p-5 border shadow-sm ${hasBlocker?"border-amber-200":"border-slate-100"}`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-sm font-bold text-brand-700 flex-shrink-0">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h4 className="text-sm font-bold text-slate-900">{u.employee_name}</h4>
                      {u.department && <span className="text-[9px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{u.department}</span>}
                      {u.project_name && <span className="text-[9px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">{u.project_name}</span>}
                    </div>
                    <div className="space-y-2">
                      {u.yesterday && <div className="flex items-start gap-2"><div className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5"><CheckCircle2 className="w-3 h-3 text-green-500"/></div><div><p className="text-[9px] font-bold text-slate-400 uppercase">Yesterday</p><p className="text-xs text-slate-700 mt-0.5">{u.yesterday}</p></div></div>}
                      {u.today && <div className="flex items-start gap-2"><div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5"><Calendar className="w-3 h-3 text-blue-500"/></div><div><p className="text-[9px] font-bold text-slate-400 uppercase">Today</p><p className="text-xs text-slate-700 mt-0.5">{u.today}</p></div></div>}
                      {hasBlocker && <div className="flex items-start gap-2"><div className="w-5 h-5 rounded-md bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5"><AlertTriangle className="w-3 h-3 text-amber-500"/></div><div><p className="text-[9px] font-bold text-amber-600 uppercase">Blocker</p><p className="text-xs text-amber-700 font-medium mt-0.5">{u.blockers}</p></div></div>}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
