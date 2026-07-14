"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Zap, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { updateEmailSettings, testEmailConnection } from "@/lib/communication-api";
import { useEmailSettings } from "@/lib/communication-queries";

export default function SettingsPage() {
  const [form, setForm] = useState({ provider: "smtp", smtp_host: "", smtp_port: "587", smtp_user: "", smtp_password: "", from_name: "", from_email: "" });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState(null);
  const [formInit, setFormInit] = useState(false);

  const { data: settingsData, isLoading: loading } = useEmailSettings();

  // Populate form once data loads
  if (settingsData && !formInit) {
    setForm(f => ({ ...f, ...settingsData }));
    setFormInit(true);
  }

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const handleSave = async () => { setSaving(true); const res = await updateEmailSettings(form); if (res.ok) showToast("Settings saved!"); else showToast(res.data?.detail || "Failed", "error"); setSaving(false); };
  const handleTest = async () => { setTesting(true); const res = await testEmailConnection(); if (res.ok) showToast("Connection successful!"); else showToast(res.data?.detail || "Connection failed", "error"); setTesting(false); };

  if (loading) return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {toast && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
          {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {toast.msg}
        </motion.div>
      )}

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-500" /> Email Configuration</h3>

        {/* Provider */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Provider</label>
          <div className="grid grid-cols-3 gap-3">
            {["smtp", "sendgrid", "resend"].map(p => (
              <button key={p} onClick={() => setForm(f => ({ ...f, provider: p }))}
                className={`py-3.5 rounded-xl border text-xs font-bold capitalize transition-all ${form.provider === p ? "bg-blue-50 border-blue-400 text-blue-700 shadow-md shadow-blue-500/10" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-200"}`}>
                {p === "smtp" ? "Custom SMTP" : p === "sendgrid" ? "SendGrid" : "Resend"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">SMTP Host</label><input value={form.smtp_host} onChange={e => setForm(f => ({ ...f, smtp_host: e.target.value }))} placeholder="smtp.gmail.com" className={inputCls} /></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Port</label><select value={form.smtp_port} onChange={e => setForm(f => ({ ...f, smtp_port: e.target.value }))} className={inputCls}><option value="587">587 (TLS)</option><option value="465">465 (SSL)</option><option value="25">25</option></select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Username</label><input value={form.smtp_user} onChange={e => setForm(f => ({ ...f, smtp_user: e.target.value }))} placeholder="no-reply@company.com" className={inputCls} /></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Password / API Key</label><input type="password" value={form.smtp_password} onChange={e => setForm(f => ({ ...f, smtp_password: e.target.value }))} placeholder="••••••••" className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">From Name</label><input value={form.from_name} onChange={e => setForm(f => ({ ...f, from_name: e.target.value }))} placeholder="HR Team" className={inputCls} /></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">From Email</label><input value={form.from_email} onChange={e => setForm(f => ({ ...f, from_email: e.target.value }))} placeholder="hr@company.com" className={inputCls} /></div>
        </div>

        <div className="flex gap-3 pt-3 border-t border-slate-100">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleTest} disabled={testing}
            className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-2">
            {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} {testing ? "Testing..." : "Test Connection"}
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving}
            className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {saving ? "Saving..." : "Save Settings"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
