"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, CheckCircle2 } from "lucide-react";

const defaultRoles = [
  { name:"Org Admin",   desc:"Full access to org settings, users, payroll, and reports",         modules:["Dashboard","Employees","Payroll","Leave","Attendance","Documents","Reports","Settings"] },
  { name:"HR Manager",  desc:"Manages employees, attendance, leave, documents. No billing access",modules:["Dashboard","Employees","Leave","Attendance","Documents","Announcements"]                },
  { name:"Employee",    desc:"Self-service: view payslips, apply leave, check attendance",        modules:["Dashboard","My Leaves","My Payslips","My Attendance","My Documents"]                    },
];

export default function RolesSettingsPage() {
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <AnimatePresence>{toast && (
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="fixed top-5 right-5 z-[200] bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400"/><span>{toast}</span>
        </motion.div>
      )}</AnimatePresence>
      <div className="p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-5">Default Role Configurations</h3>
        <div className="space-y-4">
          {defaultRoles.map((role,i)=>(
            <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}}
              className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-800">{role.name}</h4>
                <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Built-in</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">{role.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {role.modules.map(m=>(
                  <span key={m} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">{m}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          Default roles are read-only. Custom roles with fine-grained permissions will be available in a future release.
        </div>
      </div>
    </div>
  );
}
