"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Package, X, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight, Download, Edit, Trash2,
  UserPlus, RotateCcw, Eye
} from "lucide-react";
import { createAsset, updateAsset, assignAsset, returnAsset, retireAsset } from "@/lib/api";
import { useAssets, useEmployees, useDepartments, useInvalidate } from "@/lib/queries";
import { downloadCSV } from "@/lib/excel";

const statusCfg = {
  available:   { cls:"bg-green-50 text-green-600 border-green-200",  label:"Available"   },
  assigned:    { cls:"bg-blue-50 text-blue-600 border-blue-200",     label:"Assigned"    },
  maintenance: { cls:"bg-amber-50 text-amber-600 border-amber-200",  label:"Maintenance" },
  retired:     { cls:"bg-slate-50 text-slate-500 border-slate-200",  label:"Retired"     },
};
const condCfg = {
  new:     "bg-green-50 text-green-600",
  good:    "bg-blue-50 text-blue-600",
  fair:    "bg-amber-50 text-amber-600",
  damaged: "bg-red-50 text-red-500",
};

const EXPORT_COLS = [
  {label:"Asset ID",key:"asset_id"},{label:"Name",key:"name"},{label:"Category",key:"category"},
  {label:"Brand",key:"brand"},{label:"Status",key:"status"},{label:"Condition",key:"condition"},
  {label:"Assigned To",key:"assigned_to_name"},{label:"Serial",key:"serial_number"},{label:"Location",key:"location"},
];

export default function AllAssetsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("");
  const [categoryF, setCategoryF] = useState("");
  const invalidate = useInvalidate();

  const { data: assetData, isLoading } = useAssets({ page, limit:20, search:search||undefined, status:statusF||undefined, category:categoryF||undefined });
  const assets = assetData?.assets || [];
  const total = assetData?.total || 0;
  const totalPages = assetData?.pages || 1;
  const { data: empData } = useEmployees({ limit:100 });
  const employees = empData?.employees || [];
  const { data: deptList = [] } = useDepartments();

  const [toast, setToast] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showAssign, setShowAssign] = useState(null);
  const [showReturn, setShowReturn] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [showEdit, setShowEdit] = useState(null);

  const [addForm, setAddForm] = useState({ asset_id:"",name:"",category:"laptop",brand:"",model:"",serial_number:"",purchase_date:"",purchase_price:"",warranty_expiry:"",condition:"new",location:"",notes:"" });
  const [assignForm, setAssignForm] = useState({ department:"", employee_id:"",notes:"" });
  const [returnForm, setReturnForm] = useState({ condition:"good",notes:"" });
  const [editForm, setEditForm] = useState({ name:"",category:"",brand:"",model:"",serial_number:"",condition:"",location:"",notes:"",purchase_price:"",purchase_date:"",warranty_expiry:"" });

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const handleCreate = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const payload = { ...addForm, purchase_price: parseInt(addForm.purchase_price)||0 };
    const res = await createAsset(payload);
    if (res.ok) { showToast("Asset created!"); setShowAdd(false); setAddForm({asset_id:"",name:"",category:"laptop",brand:"",model:"",serial_number:"",purchase_date:"",purchase_price:"",warranty_expiry:"",condition:"new",location:"",notes:""}); invalidate("assets"); invalidate("asset-summary"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:Array.isArray(res.data?.detail)?res.data.detail.map(e=>e.msg).join(", "):"Failed","error");
    setFormLoading(false);
  };

  const handleAssign = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const res = await assignAsset(showAssign.id||showAssign._id, { employee_id: assignForm.employee_id, notes: assignForm.notes });
    if (res.ok) { showToast(res.data?.message||"Assigned!"); setShowAssign(null); setAssignForm({department:"",employee_id:"",notes:""}); invalidate("assets"); invalidate("asset-summary"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:Array.isArray(res.data?.detail)?res.data.detail.map(e=>e.msg).join(", "):"Failed","error");
    setFormLoading(false);
  };

  const handleReturn = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const res = await returnAsset(showReturn.id||showReturn._id, returnForm);
    if (res.ok) { showToast(res.data?.message||"Returned!"); setShowReturn(null); setReturnForm({condition:"good",notes:""}); invalidate("assets"); invalidate("asset-summary"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:"Failed","error");
    setFormLoading(false);
  };

  const handleRetire = async (asset) => {
    if (!confirm(`Retire "${asset.name}" (${asset.asset_id})? This cannot be undone.`)) return;
    const res = await retireAsset(asset.id||asset._id);
    if (res.ok) { showToast(res.data?.message||"Asset retired"); invalidate("assets"); invalidate("asset-summary"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:"Failed","error");
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const payload = {};
    Object.entries(editForm).forEach(([k,v]) => { if (v !== "" && v != null) payload[k] = k === "purchase_price" ? parseInt(v)||0 : v; });
    const res = await updateAsset(showEdit.id||showEdit._id, payload);
    if (res.ok) { showToast("Asset updated!"); setShowEdit(null); invalidate("assets"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:Array.isArray(res.data?.detail)?res.data.detail.map(e=>e.msg).join(", "):"Failed","error");
    setFormLoading(false);
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400";

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex-1 max-w-xs focus-within:border-brand-400">
          <Search className="w-4 h-4 text-slate-400"/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search assets..." className="bg-transparent text-sm placeholder:text-slate-400 outline-none w-full"/>
        </div>
        <select value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none">
          <option value="">All Status</option>
          <option value="available">Available</option><option value="assigned">Assigned</option><option value="maintenance">Maintenance</option><option value="retired">Retired</option>
        </select>
        <select value={categoryF} onChange={e=>{setCategoryF(e.target.value);setPage(1);}} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none">
          <option value="">All Categories</option>
          {["laptop","phone","monitor","tablet","id_card","parking","furniture","headphones","keyboard","mouse","other"].map(c=><option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
        {assets.length>0&&(
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}}
            onClick={()=>downloadCSV(assets,EXPORT_COLS,`assets_${new Date().toISOString().slice(0,10)}.csv`)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold shadow-md">
            <Download className="w-3.5 h-3.5"/> Export
          </motion.button>
        )}
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 ml-auto">
          <Plus className="w-4 h-4"/> Add Asset
        </motion.button>
      </div>

      {/* Table */}
      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : assets.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <Package className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">{search||statusF||categoryF?"No assets match":"No assets registered yet"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600">
                {["Asset","Category","Brand/Model","Status","Condition","Assigned To","Actions"].map(h=><th key={h} className="text-left text-[10px] font-bold text-white uppercase px-4 py-3 whitespace-nowrap tracking-wide">{h}</th>)}
              </tr></thead>
              <tbody>
                {assets.map((a,i)=>{
                  const sc = statusCfg[a.status]||statusCfg.available;
                  const cc = condCfg[a.condition]||"bg-slate-50 text-slate-500";
                  return (
                    <motion.tr key={a.id||a._id||i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3"><p className="text-xs font-semibold text-slate-800">{a.name}</p><p className="text-[10px] text-slate-400">{a.asset_id}{a.serial_number?` · ${a.serial_number}`:""}</p></td>
                      <td className="px-4 py-3 text-xs text-slate-600 capitalize">{a.category}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{a.brand||"—"}{a.model?` ${a.model}`:""}</td>
                      <td className="px-4 py-3"><span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span></td>
                      <td className="px-4 py-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${cc}`}>{a.condition}</span></td>
                      <td className="px-4 py-3">{a.assigned_to_name?<><p className="text-xs font-semibold text-slate-700">{a.assigned_to_name}</p><p className="text-[10px] text-slate-400">{a.assigned_to_code||a.assigned_to}</p></>:<span className="text-[10px] text-slate-300">—</span>}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={()=>{setEditForm({name:a.name||"",category:a.category||"",brand:a.brand||"",model:a.model||"",serial_number:a.serial_number||"",condition:a.condition||"",location:a.location||"",notes:a.notes||"",purchase_price:a.purchase_price||"",purchase_date:a.purchase_date||"",warranty_expiry:a.warranty_expiry||""});setShowEdit(a);}} className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center" title="Edit"><Edit className="w-3.5 h-3.5 text-blue-600"/></button>
                          {a.status==="available"&&<button onClick={()=>{setShowAssign(a);setAssignForm({department:"",employee_id:"",notes:""});}} className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center" title="Assign"><UserPlus className="w-3.5 h-3.5 text-green-600"/></button>}
                          {a.status==="assigned"&&<button onClick={()=>{setShowReturn(a);setReturnForm({condition:"good",notes:""});}} className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 flex items-center justify-center" title="Return"><RotateCcw className="w-3.5 h-3.5 text-amber-600"/></button>}
                          {a.status!=="retired"&&<button onClick={()=>handleRetire(a)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center" title="Retire"><Trash2 className="w-3.5 h-3.5 text-red-500"/></button>}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages>1&&(
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">Page {page} of {totalPages} ({total} assets)</p>
              <div className="flex gap-2">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4 text-slate-500"/></button>
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4 text-slate-500"/></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Asset Modal */}
      <AnimatePresence>
        {showAdd&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowAdd(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Add New Asset</h3><button onClick={()=>setShowAdd(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Asset ID *</label><input value={addForm.asset_id} onChange={e=>setAddForm(f=>({...f,asset_id:e.target.value}))} required placeholder="ASSET001" className={inputCls}/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Name *</label><input value={addForm.name} onChange={e=>setAddForm(f=>({...f,name:e.target.value}))} required placeholder="MacBook Pro 14" className={inputCls}/></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Category *</label>
                    <select value={addForm.category} onChange={e=>setAddForm(f=>({...f,category:e.target.value}))} className={inputCls}>
                      {["laptop","phone","monitor","tablet","id_card","parking","furniture","headphones","keyboard","mouse","other"].map(c=><option key={c} value={c} className="capitalize">{c}</option>)}
                    </select></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Brand</label><input value={addForm.brand} onChange={e=>setAddForm(f=>({...f,brand:e.target.value}))} placeholder="Apple" className={inputCls}/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Model</label><input value={addForm.model} onChange={e=>setAddForm(f=>({...f,model:e.target.value}))} placeholder="MBP M3 Pro" className={inputCls}/></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Serial Number</label><input value={addForm.serial_number} onChange={e=>setAddForm(f=>({...f,serial_number:e.target.value}))} placeholder="C02XL3MD..." className={inputCls}/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Condition</label>
                    <select value={addForm.condition} onChange={e=>setAddForm(f=>({...f,condition:e.target.value}))} className={inputCls}>
                      <option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="damaged">Damaged</option>
                    </select></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Purchase Date</label><input type="date" value={addForm.purchase_date} onChange={e=>setAddForm(f=>({...f,purchase_date:e.target.value}))} className={inputCls}/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Price (₹)</label><input type="number" value={addForm.purchase_price} onChange={e=>setAddForm(f=>({...f,purchase_price:e.target.value}))} placeholder="199000" className={inputCls}/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Warranty Expiry</label><input type="date" value={addForm.warranty_expiry} onChange={e=>setAddForm(f=>({...f,warranty_expiry:e.target.value}))} className={inputCls}/></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Location</label><input value={addForm.location} onChange={e=>setAddForm(f=>({...f,location:e.target.value}))} placeholder="Hyderabad Office" className={inputCls}/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Notes</label><input value={addForm.notes} onChange={e=>setAddForm(f=>({...f,notes:e.target.value}))} placeholder="16GB RAM, 512GB" className={inputCls}/></div>
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Creating...":"Create Asset"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Modal */}
      <AnimatePresence>
        {showAssign&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowAssign(null)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Assign Asset</h3><button onClick={()=>setShowAssign(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <p className="text-xs text-slate-500 mb-4">Assigning <strong>{showAssign.name}</strong> ({showAssign.asset_id})</p>
              <form onSubmit={handleAssign} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Department</label>
                  <select value={assignForm.department} onChange={e=>setAssignForm(f=>({...f,department:e.target.value,employee_id:""}))} className={inputCls}>
                    <option value="">All Departments</option>
                    {deptList.map(d=><option key={d.id||d.name} value={d.name}>{d.name}</option>)}
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employee *</label>
                  <select value={assignForm.employee_id} onChange={e=>setAssignForm(f=>({...f,employee_id:e.target.value}))} required className={inputCls}>
                    <option value="">Select employee...</option>
                    {employees.filter(emp=>!assignForm.department||emp.department===assignForm.department).map(emp=><option key={emp.id||emp._id} value={emp.employee_id||emp.id||emp._id}>{emp.first_name} {emp.last_name} — {emp.department} ({emp.employee_id})</option>)}
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Notes</label><input value={assignForm.notes} onChange={e=>setAssignForm(f=>({...f,notes:e.target.value}))} placeholder="Assigned during onboarding" className={inputCls}/></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Assigning...":"Assign Asset"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return Modal */}
      <AnimatePresence>
        {showReturn&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowReturn(null)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Return Asset</h3><button onClick={()=>setShowReturn(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <p className="text-xs text-slate-500 mb-4">Returning <strong>{showReturn.name}</strong> from {showReturn.assigned_to_name}</p>
              <form onSubmit={handleReturn} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Condition at Return *</label>
                  <select value={returnForm.condition} onChange={e=>setReturnForm(f=>({...f,condition:e.target.value}))} className={inputCls}>
                    <option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="damaged">Damaged</option>
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Notes</label><input value={returnForm.notes} onChange={e=>setReturnForm(f=>({...f,notes:e.target.value}))} placeholder="Minor scratches" className={inputCls}/></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Processing...":"Mark Returned"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Asset Modal */}
      <AnimatePresence>
        {showEdit&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowEdit(null)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Edit Asset</h3><button onClick={()=>setShowEdit(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <p className="text-xs text-slate-500 mb-4">Editing <strong>{showEdit.name}</strong> ({showEdit.asset_id})</p>
              <form onSubmit={handleEdit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Name</label><input value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} className={inputCls}/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Category</label>
                    <select value={editForm.category} onChange={e=>setEditForm(f=>({...f,category:e.target.value}))} className={inputCls}>
                      {["laptop","phone","monitor","tablet","id_card","parking","furniture","headphones","keyboard","mouse","other"].map(c=><option key={c} value={c} className="capitalize">{c}</option>)}
                    </select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Brand</label><input value={editForm.brand} onChange={e=>setEditForm(f=>({...f,brand:e.target.value}))} className={inputCls}/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Model</label><input value={editForm.model} onChange={e=>setEditForm(f=>({...f,model:e.target.value}))} className={inputCls}/></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Serial Number</label><input value={editForm.serial_number} onChange={e=>setEditForm(f=>({...f,serial_number:e.target.value}))} className={inputCls}/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Condition</label>
                    <select value={editForm.condition} onChange={e=>setEditForm(f=>({...f,condition:e.target.value}))} className={inputCls}>
                      <option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="damaged">Damaged</option>
                    </select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Location</label><input value={editForm.location} onChange={e=>setEditForm(f=>({...f,location:e.target.value}))} className={inputCls}/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Price (₹)</label><input type="number" value={editForm.purchase_price} onChange={e=>setEditForm(f=>({...f,purchase_price:e.target.value}))} className={inputCls}/></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Purchase Date</label><input type="date" value={editForm.purchase_date} onChange={e=>setEditForm(f=>({...f,purchase_date:e.target.value}))} className={inputCls}/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Warranty Expiry</label><input type="date" value={editForm.warranty_expiry} onChange={e=>setEditForm(f=>({...f,warranty_expiry:e.target.value}))} className={inputCls}/></div>
                </div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Notes</label><input value={editForm.notes} onChange={e=>setEditForm(f=>({...f,notes:e.target.value}))} className={inputCls}/></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Saving...":"Save Changes"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
