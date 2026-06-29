"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Mail, Phone, MapPin, Globe, Users, Shield,
  Edit, Save, CheckCircle2, AlertCircle, RefreshCw
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { getMyOrganization, updateMyOrganization } from "@/lib/api";

export default function OrgSettingsPage() {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({});

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const fetchOrg = async () => {
    setLoading(true);
    const res = await getMyOrganization();
    if (res.ok && res.data) {
      setOrg(res.data);
      setForm({
        org_name: res.data.org_name || "",
        email: res.data.email || "",
        industry: res.data.industry || "",
        country: res.data.country || "",
        state: res.data.state || "",
        org_address: res.data.org_address || "",
        admin_name: res.data.admin_name || "",
        admin_phone: res.data.admin_phone || "",
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrg(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateMyOrganization(form);
    if (res.ok) {
      showToast("Organization settings updated");
      setEditing(false);
      fetchOrg();
    } else {
      const msg = typeof res.data?.detail === "string" ? res.data.detail :
        Array.isArray(res.data?.detail) ? res.data.detail.map(e => e.msg).join(", ") : "Update failed";
      showToast(msg, "error");
    }
    setSaving(false);
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 transition-all";
  const readCls = "w-full px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-600";

  if (loading) return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Organization Settings" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.type==="error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Organization Settings</h2>
            <p className="text-sm text-slate-500">View and manage your organization details</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchOrg} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50">
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
            {!editing ? (
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
                <Edit className="w-4 h-4" /> Edit
              </motion.button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-green-500/20 disabled:opacity-70">
                  <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* Plan Info (Read-only — superadmin controlled) */}
        {org && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
            className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-blue-200">Your Plan</p>
                <h3 className="text-lg font-bold">{org.org_name}</h3>
                <p className="text-xs text-blue-200 mt-0.5">Status: <span className="font-bold text-white capitalize">{org.status}</span></p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xl font-black">{org.emp_count_for_access}</p>
                  <p className="text-[10px] text-blue-200">Max Employees</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black">{org.admin_user_access_limit}</p>
                  <p className="text-[10px] text-blue-200">Admin Slots</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Organization Details */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-brand-500" /> Organization Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Organization Name</label>
                {editing ? <input value={form.org_name} onChange={e=>setForm(f=>({...f,org_name:e.target.value}))} className={inputCls} />
                  : <p className={readCls}>{org?.org_name || "—"}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Contact Email</label>
                {editing ? <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className={inputCls} />
                  : <p className={readCls}>{org?.email || "—"}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Industry</label>
                {editing ? <input value={form.industry} onChange={e=>setForm(f=>({...f,industry:e.target.value}))} className={inputCls} />
                  : <p className={readCls}>{org?.industry || "—"}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Country</label>
                {editing ? <input value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} className={inputCls} />
                  : <p className={readCls}>{org?.country || "—"}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">State</label>
                {editing ? <input value={form.state} onChange={e=>setForm(f=>({...f,state:e.target.value}))} className={inputCls} />
                  : <p className={readCls}>{org?.state || "—"}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Office Address</label>
                {editing ? <input value={form.org_address} onChange={e=>setForm(f=>({...f,org_address:e.target.value}))} className={inputCls} />
                  : <p className={readCls}>{org?.org_address || "—"}</p>}
              </div>
            </div>
          </div>

          {/* Admin Contact */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-brand-500" /> Primary Administrator</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Admin Name</label>
                {editing ? <input value={form.admin_name} onChange={e=>setForm(f=>({...f,admin_name:e.target.value}))} className={inputCls} />
                  : <p className={readCls}>{org?.admin_name || "—"}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Admin Email</label>
                <p className={readCls}>{org?.admin_email || "—"}</p>
                {editing && <p className="text-[10px] text-slate-400 mt-1">Email can only be changed by superadmin</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Admin Phone</label>
                {editing ? <input value={form.admin_phone} onChange={e=>setForm(f=>({...f,admin_phone:e.target.value}))} className={inputCls} />
                  : <p className={readCls}>{org?.admin_phone || "—"}</p>}
              </div>
            </div>
          </div>

          {/* Read-only plan limits */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-brand-500" /> Plan Limits <span className="text-[10px] text-slate-400 font-normal">(managed by superadmin)</span></h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 text-center">
                <p className="text-xl font-black text-slate-700">{org?.emp_count_for_access || "—"}</p>
                <p className="text-xs text-slate-500">Max Employees</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 text-center">
                <p className="text-xl font-black text-slate-700">{org?.admin_user_access_limit || "—"}</p>
                <p className="text-xs text-slate-500">Admin User Limit</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 text-center">
                <p className="text-xl font-black text-slate-700 capitalize">{org?.status || "—"}</p>
                <p className="text-xs text-slate-500">Status</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3">Contact superadmin to increase limits or change plan.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
