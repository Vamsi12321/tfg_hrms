"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, ToggleLeft, ToggleRight, CheckCircle2 } from "lucide-react";

const featureFlags = [
  { key:"ai",         label:"AI Insights Module",       desc:"Enable AI-powered HR analytics, predictions, and recommendations"     },
  { key:"wellness",   label:"Wellness & Mood Tracking", desc:"Daily wellness check-ins and mood analytics for employees"            },
  { key:"talent",     label:"Talent Finder",            desc:"AI-based talent search and skill gap analysis"                        },
  { key:"analytics",  label:"Advanced Analytics",       desc:"Department-level charts, turnover analytics, and custom reports"      },
  { key:"payroll",    label:"Payroll Module",           desc:"Full payroll processing, payslips, and PF/ESI compliance"             },
  { key:"documents",  label:"Document Management",      desc:"Company docs, templates, and employee document requests"              },
  { key:"performance",label:"Performance & OKRs",       desc:"Goal tracking, OKR management, and peer reviews"                     },
];

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState({ ai:true, wellness:true, talent:true, analytics:true, payroll:true, documents:true, performance:true });
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  const toggle = (key) => setFlags(f => ({ ...f, [key]: !f[key] }));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="fixed top-5 right-5 z-[200] bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Feature Flags</h3>
        <p className="text-[10px] text-slate-400 mb-5">Toggle features on or off globally across all organizations.</p>

        <div className="space-y-3">
          {featureFlags.map((f, i) => (
            <motion.div key={f.key} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${flags[f.key] ? "bg-amber-50/50 border-amber-100" : "bg-slate-50 border-slate-100"}`}>
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-800">{f.label}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${flags[f.key] ? "bg-green-50 text-green-600 border-green-200" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                    {flags[f.key] ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{f.desc}</p>
              </div>
              <button type="button" onClick={() => toggle(f.key)} className="flex-shrink-0">
                {flags[f.key]
                  ? <ToggleRight className="w-9 h-9 text-amber-600" />
                  : <ToggleLeft className="w-9 h-9 text-slate-400" />
                }
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
          Disabling a module hides it from all users immediately. Existing data is preserved.
        </div>

        <div className="mt-5">
          <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
            onClick={() => showToast("Feature flags saved successfully.")}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20">
            <Save className="w-4 h-4" /> Save Flags
          </motion.button>
        </div>
      </div>
    </div>
  );
}
