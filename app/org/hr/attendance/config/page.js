"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertCircle, Clock, SunDim, Sunset,
  Timer, Camera, MapPin, Pencil, Save, Hourglass, ToggleLeft, ToggleRight
} from "lucide-react";
import { updateAttendanceConfig } from "@/lib/api";
import { useAttendanceConfig, useInvalidate } from "@/lib/queries";

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

function StatCard({ icon: Icon, label, value, color, bg, border }) {
  return (
    <div className={`rounded-2xl border ${border} ${bg} p-5 flex flex-col gap-2`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg} border ${border}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function ToggleCard({ label, description, checked, onChange, color = "brand" }) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
        checked
          ? `bg-${color}-50/60 border-${color}-200/50`
          : "bg-white border-slate-100"
      }`}
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${checked ? `bg-${color}-100 border border-${color}-200/50` : "bg-slate-50 border border-slate-200/50"}`}>
          {checked
            ? <ToggleRight className={`w-4 h-4 text-${color}-600`} />
            : <ToggleLeft className="w-4 h-4 text-slate-400" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-[10px] text-slate-400">{description}</p>
        </div>
      </div>
      <div className={`w-10 h-5 rounded-full transition-all relative ${checked ? `bg-${color}-500` : "bg-slate-200"}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? "left-5" : "left-0.5"}`} />
      </div>
    </div>
  );
}

export default function AttendanceConfigPage() {
  const invalidate = useInvalidate();
  const { data: configData, isLoading } = useAttendanceConfig();
  const [config, setConfig] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => { if (configData) setConfig(configData); }, [configData]);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const handleSave = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const { organization_id, ...configBody } = config;
    const res = await updateAttendanceConfig(configBody);
    if (res.ok) { showToast("Configuration saved successfully"); invalidate("attendance-config"); setEditing(false); }
    else showToast(typeof res.data?.detail === "string" ? res.data.detail : "Failed to save", "error");
    setFormLoading(false);
  };

  if (isLoading) return (
    <div className="p-16 flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      <p className="text-xs text-slate-400 font-medium">Loading configuration…</p>
    </div>
  );

  if (!config) return (
    <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
      <p className="text-xs text-slate-400">Configuration not available</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Attendance Policy</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Manage shift timings, grace periods and check-in rules</p>
        </div>
        {!editing ? (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/25 transition-shadow">
            <Pencil className="w-3.5 h-3.5" /> Edit Policy
          </motion.button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleSave} disabled={formLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-70 transition-all">
              {formLoading
                ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
            </motion.button>
          </div>
        )}
      </div>

      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-5">

        {/* Shift Timing cards */}
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-slate-50">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100/50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Shift Timings</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Daily work schedule</p>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: SunDim, label: "Shift Start", key: "shift_start", type: "time", color: "text-amber-600", bg: "bg-amber-50/60", border: "border-amber-100/40" },
                { icon: Sunset, label: "Shift End", key: "shift_end", type: "time", color: "text-orange-600", bg: "bg-orange-50/60", border: "border-orange-100/40" },
                { icon: Timer, label: "Grace Period", key: "grace_period_minutes", type: "number", suffix: "min", color: "text-blue-600", bg: "bg-blue-50/60", border: "border-blue-100/40" },
                { icon: Hourglass, label: "Full Day Hours", key: "min_hours_full_day", type: "number", suffix: "hrs", color: "text-emerald-600", bg: "bg-emerald-50/60", border: "border-emerald-100/40" },
                { icon: Hourglass, label: "Half Day Hours", key: "min_hours_half_day", type: "number", suffix: "hrs", color: "text-teal-600", bg: "bg-teal-50/60", border: "border-teal-100/40" },
              ].map(({ icon: Icon, label, key, type, suffix, color, bg, border }) => (
                <div key={key} className={`rounded-2xl border ${border} ${bg} p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
                  </div>
                  {editing ? (
                    <input
                      type={type}
                      value={config[key] || ""}
                      onChange={e => setConfig(c => ({ ...c, [key]: type === "number" ? parseInt(e.target.value) : e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border bg-white text-sm font-bold ${color} outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all`}
                    />
                  ) : (
                    <p className={`text-2xl font-black ${color}`}>
                      {config[key] || "—"}{suffix && <span className="text-sm font-bold text-slate-400 ml-1">{suffix}</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Toggle options */}
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-slate-50">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100/50 flex items-center justify-center">
              <Camera className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Check-in Rules</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Selfie and location requirements</p>
            </div>
          </div>
          <div className="px-6 py-5 space-y-3">
            {editing ? (
              <>
                <ToggleCard
                  label="Photo Required"
                  description="Employees must take a selfie on check-in"
                  checked={!!config.photo_required}
                  onChange={v => setConfig(c => ({ ...c, photo_required: v }))}
                  color="brand"
                />
                <ToggleCard
                  label="Location Required for Check-out"
                  description="GPS location must be captured on check-out"
                  checked={!!config.location_required_for_checkout}
                  onChange={v => setConfig(c => ({ ...c, location_required_for_checkout: v }))}
                  color="indigo"
                />
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Camera, label: "Photo on Check-in", key: "photo_required", color: "text-brand-600", bg: "bg-brand-50/60", border: "border-brand-100/40" },
                  { icon: MapPin, label: "Location on Check-out", key: "location_required_for_checkout", color: "text-indigo-600", bg: "bg-indigo-50/60", border: "border-indigo-100/40" },
                ].map(({ icon: Icon, label, key, color, bg, border }) => (
                  <div key={key} className={`flex items-center justify-between rounded-2xl border ${border} ${bg} px-5 py-4`}>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-xs font-semibold text-slate-700">{label}</span>
                    </div>
                    <span className={`text-xs font-black ${config[key] ? color : "text-slate-400"}`}>
                      {config[key] ? "Required" : "Optional"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
