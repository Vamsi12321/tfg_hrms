"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Save, Zap, RefreshCw, CheckCircle2, AlertCircle, Server, Mail, Shield, Globe, Pencil } from "lucide-react";
import { updateEmailSettings, testEmailConnection } from "@/lib/communication-api";
import { useEmailSettings } from "@/lib/communication-queries";

export default function SettingsPage() {
  const [form, setForm] = useState({ provider: "smtp", smtp_host: "", smtp_port: "587", smtp_user: "", smtp_password: "", from_name: "", from_email: "" });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState(null);
  const [formInit, setFormInit] = useState(false);

  const { data: settingsData, isLoading: loading } = useEmailSettings();
  if (settingsData && !formInit) { setForm(f => ({ ...f, ...settingsData })); setFormInit(true); }

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };
  const handleSave = async () => { setSaving(true); const res = await updateEmailSettings(form); if (res.ok) { showToast("Settings saved!"); setEditing(false); } else showToast(res.data?.detail || "Failed", "error"); setSaving(false); };
  const handleTest = async () => { setTesting(true); const res = await testEmailConnection(); if (res.ok) showToast("Connection successful! ✅"); else showToast(res.data?.detail || "Connection failed", "error"); setTesting(false); };

  if (loading) return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;

  const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all";

  return (
    <div className="space-y-5">
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>{toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {toast.msg}</motion.div>)}</AnimatePresence>

      {/* Page Header (like Attendance Policy) */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Email Configuration</h2>
          <p className="text-xs text-slate-400">Manage SMTP credentials and sender identity</p>
        </div>
        {!editing ? (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm">
            <Pencil className="w-3.5 h-3.5" /> Edit Settings
          </motion.button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-60">
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {saving ? "Saving..." : "Save"}
            </motion.button>
          </div>
        )}
      </div>

      {/* SMTP Server Section (like "Shift Timings") */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100"><Server className="w-5 h-5 text-blue-600" /></div>
          <div><h3 className="text-sm font-bold text-slate-900">SMTP Server</h3><p className="text-[10px] text-slate-400">Mail server connection details</p></div>
        </div>

        {editing ? (
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Provider</label>
              <select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} className={`${inputCls} cursor-pointer`}><option value="smtp">Custom SMTP</option><option value="sendgrid">SendGrid</option><option value="resend">Resend</option></select></div>
            <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">SMTP Host</label><input value={form.smtp_host} onChange={e => setForm(f => ({ ...f, smtp_host: e.target.value }))} placeholder="smtp.gmail.com" className={inputCls} /></div>
            <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Port</label>
              <select value={form.smtp_port} onChange={e => setForm(f => ({ ...f, smtp_port: e.target.value }))} className={`${inputCls} cursor-pointer`}><option value="587">587 (TLS)</option><option value="465">465 (SSL)</option><option value="25">25</option></select></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1"><Globe className="w-3 h-3" /> Provider</p>
              <p className="text-lg font-black text-blue-700 mt-1 capitalize">{form.provider || "—"}</p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1"><Server className="w-3 h-3" /> SMTP Host</p>
              <p className="text-sm font-bold text-indigo-700 mt-1">{form.smtp_host || "Not configured"}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Port</p>
              <p className="text-lg font-black text-slate-700 mt-1">{form.smtp_port || "—"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Credentials Section (like "Check-in Rules") */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100"><Shield className="w-5 h-5 text-amber-600" /></div>
          <div><h3 className="text-sm font-bold text-slate-900">Credentials</h3><p className="text-[10px] text-slate-400">Authentication for mail server</p></div>
        </div>

        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Username / Email</label><input value={form.smtp_user} onChange={e => setForm(f => ({ ...f, smtp_user: e.target.value }))} placeholder="no-reply@company.com" className={inputCls} /></div>
            <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Password / API Key</label><input type="password" value={form.smtp_password} onChange={e => setForm(f => ({ ...f, smtp_password: e.target.value }))} placeholder="••••••••" className={inputCls} /></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div><p className="text-[9px] font-bold text-slate-400 uppercase">Username</p><p className="text-sm font-bold text-slate-800 mt-1">{form.smtp_user || "Not set"}</p></div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${form.smtp_user ? "text-green-600 bg-green-50 border border-green-200" : "text-red-500 bg-red-50 border border-red-200"}`}>{form.smtp_user ? "Configured" : "Missing"}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div><p className="text-[9px] font-bold text-slate-400 uppercase">Password</p><p className="text-sm font-bold text-slate-800 mt-1">••••••••</p></div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${form.smtp_password ? "text-green-600 bg-green-50 border border-green-200" : "text-red-500 bg-red-50 border border-red-200"}`}>{form.smtp_password ? "Set" : "Missing"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Sender Identity (like another section) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100"><Mail className="w-5 h-5 text-emerald-600" /></div>
          <div><h3 className="text-sm font-bold text-slate-900">Sender Identity</h3><p className="text-[10px] text-slate-400">How emails appear to recipients</p></div>
        </div>

        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">From Name</label><input value={form.from_name} onChange={e => setForm(f => ({ ...f, from_name: e.target.value }))} placeholder="HR Team" className={inputCls} /></div>
            <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">From Email</label><input value={form.from_email} onChange={e => setForm(f => ({ ...f, from_email: e.target.value }))} placeholder="hr@company.com" className={inputCls} /></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">From Name</p>
              <p className="text-lg font-black text-emerald-700 mt-1">{form.from_name || "Not set"}</p>
            </div>
            <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100">
              <p className="text-[9px] font-bold text-teal-500 uppercase tracking-wider">From Email</p>
              <p className="text-sm font-bold text-teal-700 mt-1">{form.from_email || "Not set"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Test Connection */}
      {!editing && (
        <div className="flex justify-end">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleTest} disabled={testing}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 shadow-sm">
            {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />} {testing ? "Testing..." : "Test Connection"}
          </motion.button>
        </div>
      )}
    </div>
  );
}
