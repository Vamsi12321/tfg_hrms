"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Plus, X, Edit, Trash2, Users, Search,
  CheckCircle2, AlertCircle, RefreshCw, Upload, FileText
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { createDepartment, updateDepartment, deleteDepartment, importDepartmentsCSV } from "@/lib/api";
import { useDepartments, useInvalidate } from "@/lib/queries";

export default function DepartmentsPage() {
  const { data: departments = [], isLoading: loading } = useDepartments();
  const invalidate = useInvalidate();
  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [showCSV, setShowCSV] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [csvResult, setCsvResult] = useState(null);
  const csvRef = useRef(null);

  const [form, setForm] = useState({ name: "", code: "", description: "" });

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const res = await createDepartment({ name: form.name, code: form.code, description: form.description || undefined });
    if (res.ok) { showToast(`Department "${form.name}" created`); setShowCreate(false); setForm({ name:"", code:"", description:"" }); invalidate("departments"); }
    else {
      const msg = typeof res.data?.detail === "string" ? res.data.detail : res.data?.detail?.[0]?.msg || "Failed";
      showToast(msg, "error");
    }
    setFormLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!showEdit) return;
    setFormLoading(true);
    const payload = {};
    if (form.name) payload.name = form.name;
    if (form.description !== undefined) payload.description = form.description;
    const res = await updateDepartment(showEdit.id || showEdit._id, payload);
    if (res.ok) { showToast("Department updated"); setShowEdit(null); invalidate("departments"); }
    else showToast(typeof res.data?.detail === "string" ? res.data.detail : "Failed", "error");
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setFormLoading(true);
    const res = await deleteDepartment(showDelete.id || showDelete._id);
    if (res.ok) { showToast("Department deactivated"); setShowDelete(null); invalidate("departments"); }
    else showToast(typeof res.data?.detail === "string" ? res.data.detail : "Cannot delete — employees still exist", "error");
    setFormLoading(false);
    setShowDelete(null);
  };

  const handleCSVImport = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    setFormLoading(true);
    setCsvResult(null);
    const res = await importDepartmentsCSV(csvFile);
    if (res.ok) { setCsvResult(res.data); showToast(`${res.data?.imported || 0} departments imported`); invalidate("departments"); }
    else showToast(typeof res.data?.detail === "string" ? res.data.detail : "Import failed", "error");
    setFormLoading(false);
  };

  const filtered = departments.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()) || d.code?.toLowerCase().includes(search.toLowerCase()));

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 transition-all";

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Departments" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.type==="error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Departments</h2>
            <p className="text-sm text-slate-500">{departments.length} departments</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => invalidate("departments")} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50">
              <RefreshCw className={`w-4 h-4 text-slate-500 ${loading?"animate-spin":""}`} />
            </button>
            <button onClick={() => { setShowCSV(true); setCsvFile(null); setCsvResult(null); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Upload className="w-4 h-4" /> CSV Import
            </button>
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => { setShowCreate(true); setForm({ name:"", code:"", description:"" }); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
              <Plus className="w-4 h-4" /> Add Department
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 max-w-sm focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search departments..."
            className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full" />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
            <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">{search ? "No departments match" : "No departments yet"}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((dept, i) => (
              <motion.div key={dept.id || dept._id || i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{dept.code}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${dept.status==="active"?"bg-green-50 text-green-600":"bg-red-50 text-red-500"}`}>
                      {dept.status || "active"}
                    </span>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-0.5">{dept.name}</h4>
                {dept.description && <p className="text-xs text-slate-500 mb-2">{dept.description}</p>}
                {dept.employee_count !== undefined && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                    <Users className="w-3.5 h-3.5" /> {dept.employee_count} employees
                  </div>
                )}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setShowEdit(dept); setForm({ name:dept.name, code:dept.code, description:dept.description||"" }); }}
                    className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100 flex items-center gap-1">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => setShowDelete(dept)}
                    className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Create Department</h3>
                <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Department Name *</label>
                  <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required placeholder="Engineering" className={inputCls} /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Code * <span className="text-slate-400 font-normal">(unique, auto-uppercased)</span></label>
                  <input value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} required placeholder="ENG" maxLength={10} className={`${inputCls} font-mono uppercase`} /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                  <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Software development team" className={`${inputCls} resize-none`} /></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Creating..." : "Create Department"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEdit(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Edit Department</h3>
                <button onClick={() => setShowEdit(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Department Name</label>
                  <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Engineering" className={inputCls} /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Code</label>
                  <input value={form.code} readOnly className={`${inputCls} bg-slate-50 text-slate-400 font-mono`} /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                  <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className={`${inputCls} resize-none`} /></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Saving..." : "Save Changes"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDelete && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDelete(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-600" /></div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Department</h3>
                  <p className="text-xs text-slate-500">Fails if employees exist in it</p>
                </div>
              </div>
              <p className="text-sm text-slate-700 mb-5">Delete <strong>{showDelete.name}</strong> ({showDelete.code})?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDelete(null)} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50">Cancel</button>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={handleDelete} disabled={formLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 disabled:opacity-70">
                  {formLoading ? "..." : "Delete"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSV Import Modal */}
      <AnimatePresence>
        {showCSV && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCSV(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Import Departments (CSV)</h3>
                <button onClick={() => setShowCSV(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4">
                <p className="text-[10px] font-bold text-slate-600 mb-1">Required columns:</p>
                <p className="text-[10px] text-slate-500 font-mono">name, code</p>
                <p className="text-[10px] text-slate-400 mt-1">Optional: description</p>
              </div>
              <form onSubmit={handleCSVImport} className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-brand-400 transition-colors cursor-pointer" onClick={() => csvRef.current?.click()}>
                  <Upload className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                  {csvFile ? <p className="text-xs font-semibold text-brand-600">{csvFile.name}</p> : <p className="text-xs text-slate-500">Click to select CSV file</p>}
                  <input ref={csvRef} type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0]||null)} className="hidden" />
                </div>
                {csvResult && (
                  <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                    <p className="text-xs font-bold text-green-700">✓ {csvResult.imported} imported, {csvResult.failed} failed</p>
                    {csvResult.errors?.length > 0 && csvResult.errors.slice(0,5).map((err,i) => (
                      <p key={i} className="text-[10px] text-red-600 mt-1">Row {err.row}: {err.error}</p>
                    ))}
                  </div>
                )}
                <motion.button type="submit" disabled={!csvFile || formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-50">
                  {formLoading ? "Importing..." : "Upload & Import"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
