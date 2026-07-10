"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Plus, CheckCircle2, AlertCircle, X, Edit, Trash2 } from "lucide-react";
import { createAssetCategory, updateAssetCategory, deleteAssetCategory } from "@/lib/api";
import { useAssetCategories, useInvalidate } from "@/lib/queries";

export default function AssetCategoriesPage() {
  const invalidate = useInvalidate();
  const { data: categories = [], isLoading } = useAssetCategories();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState({ name:"", code:"", description:"" });
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const handleCreate = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const res = await createAssetCategory(form);
    if (res.ok) { showToast("Category created!"); setShowAdd(false); setForm({name:"",code:"",description:""}); invalidate("asset-categories"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:Array.isArray(res.data?.detail)?res.data.detail.map(e=>e.msg).join(", "):"Failed","error");
    setFormLoading(false);
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const res = await updateAssetCategory(showEdit.id||showEdit._id||showEdit.code, form);
    if (res.ok) { showToast("Category updated!"); setShowEdit(null); invalidate("asset-categories"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:Array.isArray(res.data?.detail)?res.data.detail.map(e=>e.msg).join(", "):"Failed","error");
    setFormLoading(false);
  };

  const handleDelete = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    const res = await deleteAssetCategory(cat.id||cat._id||cat.code);
    if (res.ok) { showToast("Category deleted"); invalidate("asset-categories"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:"Failed to delete","error");
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400";

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      <div className="flex justify-end">
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>{setForm({name:"",code:"",description:""});setShowAdd(true);}}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
          <Plus className="w-4 h-4"/> Add Category
        </motion.button>
      </div>

      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : categories.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <Tag className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">No asset categories yet</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat,i)=>(
            <motion.div key={cat.id||cat._id||cat.code||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center"><Tag className="w-5 h-5 text-brand-600"/></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{cat.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono uppercase">{cat.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={()=>{setForm({name:cat.name||"",code:cat.code||"",description:cat.description||""});setShowEdit(cat);}}
                    className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center">
                    <Edit className="w-3.5 h-3.5 text-blue-600"/>
                  </button>
                  <button onClick={()=>handleDelete(cat)}
                    className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5 text-red-500"/>
                  </button>
                </div>
              </div>
              {cat.description&&<p className="text-xs text-slate-500 mt-1">{cat.description}</p>}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAdd||showEdit)&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>{setShowAdd(false);setShowEdit(null);}}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">{showEdit?"Edit":"New"} Category</h3><button onClick={()=>{setShowAdd(false);setShowEdit(null);}} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={showEdit?handleEdit:handleCreate} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required placeholder="Projector" className={inputCls}/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Code *</label><input value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} required placeholder="projector" className={`${inputCls} font-mono`} disabled={!!showEdit}/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label><input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Conference room projectors" className={inputCls}/></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Saving...":showEdit?"Save Changes":"Create Category"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
