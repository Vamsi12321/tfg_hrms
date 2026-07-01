"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { updateAttendanceConfig } from "@/lib/api";
import { useAttendanceConfig, useInvalidate } from "@/lib/queries";

export default function AttendanceConfigPage() {
  const invalidate = useInvalidate();
  const { data: configData, isLoading } = useAttendanceConfig();
  const [config, setConfig] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { if (configData) setConfig(configData); }, [configData]);

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const handleSave = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const { organization_id, ...configBody } = config;
    const res = await updateAttendanceConfig(configBody);
    if (res.ok) { showToast("Config saved"); invalidate("attendance-config"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:"Failed to save","error");
    setFormLoading(false);
  };

  if (isLoading) return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>;
  if (!config) return <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center"><p className="text-xs text-slate-400">Config not available</p></div>;

  return (
    <div>
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm max-w-2xl space-y-5">
        <h3 className="text-sm font-bold text-slate-900">Attendance Policy Configuration</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            ["Shift Start","shift_start","time"],
            ["Shift End","shift_end","time"],
            ["Grace Period (min)","grace_period_minutes","number"],
            ["Min Hours (Full Day)","min_hours_full_day","number"],
            ["Min Hours (Half Day)","min_hours_half_day","number"],
          ].map(([label,key,type])=>(
            <div key={key}>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{label}</label>
              <input type={type} value={config[key]||""} onChange={e=>setConfig(c=>({...c,[key]:type==="number"?parseInt(e.target.value):e.target.value}))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-6">
          {[["Photo Required","photo_required"],["Location for Check-out","location_required_for_checkout"]].map(([label,key])=>(
            <label key={key} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input type="checkbox" checked={!!config[key]} onChange={e=>setConfig(c=>({...c,[key]:e.target.checked}))} className="w-4 h-4 rounded border-slate-300 text-brand-600"/>
              {label}
            </label>
          ))}
        </div>
        <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}}
          className="px-6 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">
          {formLoading?"Saving...":"Save Configuration"}
        </motion.button>
      </form>
    </div>
  );
}
