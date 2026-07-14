"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Mail, Phone, MapPin, Globe, Users, Shield,
  Edit, Save, CheckCircle2, AlertCircle, RefreshCw, Upload
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { getMyOrganization, updateMyOrganization, uploadOrgLogo } from "@/lib/api";
import { useInvalidate } from "@/lib/queries";

export default function OrgSettingsPage() {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({});
  const invalidate = useInvalidate();

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const fetchOrg = async () => {
    setLoading(true);
    const res = await getMyOrganization();
    if (res.ok && res.data) {
      setOrg(res.data);
      setForm({
        org_name: res.data.org_name || "",
        email: res.data.email || "",
        domain: res.data.domain || "",
        profile_image: res.data.profile_image || "",
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
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Organization Settings" />
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
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
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md">
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
              <div className="flex items-center gap-3">
                {org.profile_image ? (
                  <img src={org.profile_image} alt="Logo" className="w-12 h-12 rounded-xl object-cover border-2 border-white/20" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white/70" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-blue-200">Your Organization</p>
                  <h3 className="text-lg font-bold">{org.org_name}</h3>
                  <p className="text-xs text-blue-200 mt-0.5">Status: <span className="font-bold text-white capitalize">{org.status}</span></p>
                </div>
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
            <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500" /> Organization Details</h3>

            {/* Profile Image */}
            <div className="mb-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center flex-shrink-0">
                {form.profile_image ? (
                  <img src={form.profile_image} alt="Org Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">Organization Logo</p>
                <p className="text-[10px] text-slate-400 mb-2">Shown in sidebar and branding</p>
                {editing && (
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold cursor-pointer hover:bg-blue-100 transition-colors border border-blue-200">
                    <Upload className="w-3 h-3" /> Upload Logo
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const res = await uploadOrgLogo(file);
                      if (res.ok && res.data?.profile_image) {
                        setForm(f => ({ ...f, profile_image: res.data.profile_image }));
                        showToast("Logo uploaded");
                        fetchOrg();
                        invalidate(["my-organization"]);
                      } else {
                        showToast("Upload failed", "error");
                      }
                    }} />
                  </label>
                )}
              </div>
            </div>

            {editing ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: "Organization Name", key: "org_name" },
                  { label: "Contact Email", key: "email" },
                  { label: "Domain", key: "domain" },
                  { label: "Industry", key: "industry" },
                  { label: "Country", key: "country" },
                  { label: "State", key: "state" },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">{field.label}</label>
                    <input value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} className={inputCls} />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Office Address</label>
                  <input value={form.org_address} onChange={e => setForm(f => ({ ...f, org_address: e.target.value }))} className={inputCls} />
                </div>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                    <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1"><Globe className="w-3 h-3" /> Organization Name</p>
                    <p className="text-lg font-black text-blue-700 mt-1">{org?.org_name || "—"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1"><Mail className="w-3 h-3" /> Contact Email</p>
                    <p className="text-sm font-bold text-indigo-700 mt-1">{org?.email || "—"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1"><Globe className="w-3 h-3" /> Domain</p>
                    <p className="text-lg font-black text-emerald-700 mt-1">{org?.domain || "—"}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Industry</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{org?.industry || "—"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Country / State</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{org?.country || "—"}{org?.state ? `, ${org.state}` : ""}</p>
                  </div>
                  <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3" /> Office Address</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{org?.org_address || "—"}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Admin Contact */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500" /> Primary Administrator</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Admin Name", key: "admin_name" },
                { label: "Admin Phone", key: "admin_phone" },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">{field.label}</label>
                  {editing ? (
                    <input value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} className={inputCls} />
                  ) : (
                    <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">{org?.[field.key] || "—"}</p>
                    </div>
                  )}
                </div>
              ))}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Admin Email</label>
                <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">{org?.admin_email || "—"}</p>
                </div>
                {editing && <p className="text-[9px] text-slate-400 mt-1">Email can only be changed by superadmin</p>}
              </div>
            </div>
          </div>

          {/* Plan Limits */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Plan Limits <span className="text-[10px] text-slate-400 font-normal">(managed by superadmin)</span></h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-center">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Max Employees</p>
                <p className="text-2xl font-black text-blue-700">{org?.emp_count_for_access || "—"}</p>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Admin Slots</p>
                <p className="text-2xl font-black text-indigo-700">{org?.admin_user_access_limit || "—"}</p>
              </div>
              <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-center">
                <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">Status</p>
                <p className="text-2xl font-black text-green-700 capitalize">{org?.status || "—"}</p>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 mt-3">Contact superadmin to increase limits or change plan.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
