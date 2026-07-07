"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban, Plus, Users, Edit, Trash2, X, Search,
  CheckCircle2, AlertCircle, UserPlus, UserMinus
} from "lucide-react";
import { createProject, updateProject, archiveProject,
  addProjectMember, removeProjectMember } from "@/lib/api";
import { useProjects, useEmployees, useDepartments, useInvalidate } from "@/lib/queries";
import ExportButton from "@/components/ExportButton";

const statusCfg = {
  active:    { cls: "bg-green-50 text-green-600 border-green-200",  label: "Active"    },
  completed: { cls: "bg-blue-50 text-blue-600 border-blue-200",     label: "Completed" },
  archived:  { cls: "bg-slate-50 text-slate-400 border-slate-200",  label: "Archived"  },
};

export default function ProjectsPage() {
  const invalidate = useInvalidate();
  const { data: projData, isLoading } = useProjects();
  const projects = projData?.projects || [];
  const { data: empData } = useEmployees({ limit: 100 });
  const employees = empData?.employees || [];

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm] = useState({ name:"", description:"", team_lead:"", members:[] });
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showMembers, setShowMembers] = useState(null);
  const [addMemberId, setAddMemberId] = useState("");

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const openCreate = () => { setForm({name:"",description:"",team_lead:"",members:[]}); setEditItem(null); setShowCreate(true); };
  const openEdit = (p) => { setForm({name:p.name,description:p.description||"",team_lead:p.team_lead||"",members:p.members||[]}); setEditItem(p); setShowCreate(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const payload = { name:form.name, description:form.description||undefined, team_lead:form.team_lead||undefined, members:form.members.length>0?form.members:undefined };
    const res = editItem ? await updateProject(editItem.id||editItem._id, payload) : await createProject(payload);
    if (res.ok) { showToast(editItem?"Project updated":"Project created"); setShowCreate(false); invalidate("projects"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:"Failed","error");
    setFormLoading(false);
  };

  const handleArchive = async (p) => {
    if (!confirm(`Archive "${p.name}"?`)) return;
    const res = await archiveProject(p.id||p._id);
    if (res.ok) { showToast("Project archived"); invalidate("projects"); }
    else showToast("Failed","error");
  };

  const handleAddMember = async (projectId) => {
    if (!addMemberId) return;
    const res = await addProjectMember(projectId, addMemberId);
    if (res.ok) { showToast("Member added"); setAddMemberId(""); invalidate("projects"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:"Failed","error");
  };

  const handleRemoveMember = async (projectId, empId) => {
    const res = await removeProjectMember(projectId, empId);
    if (res.ok) { showToast("Member removed"); invalidate("projects"); }
    else showToast("Failed","error");
  };

  const [memberSearch, setMemberSearch] = useState("");
  const [memberDept, setMemberDept]   = useState("");

  const { data: deptList = [] } = useDepartments();

  // Filter employees for the member/lead selection
  const filteredEmps = employees.filter(e => {
    const name = `${e.first_name} ${e.last_name}`.toLowerCase();
    const matchSearch = !memberSearch || name.includes(memberSearch.toLowerCase()) || (e.department||"").toLowerCase().includes(memberSearch.toLowerCase());
    const matchDept = !memberDept || e.department === memberDept;
    // Exclude the currently selected team lead from members list
    const id = e.employee_id || e.id || e._id;
    const isSelectedLead = form.team_lead && id === form.team_lead;
    return matchSearch && matchDept && !isSelectedLead;
  });

  const toggleMember = (empId) => {
    setForm(f => ({...f, members: f.members.includes(empId) ? f.members.filter(m=>m!==empId) : [...f.members, empId] }));
  };

  // When team lead changes, remove them from members if they were selected
  const handleLeadChange = (leadId) => {
    setForm(f => ({
      ...f,
      team_lead: leadId,
      members: f.members.filter(m => m !== leadId),
    }));
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Projects</h3>
          <p className="text-[10px] text-slate-500">{projects.length} projects</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton 
            data={projects}
            filename="projects_export.csv"
            columns={[
              { header: "Name", key: "name" },
              { header: "Description", key: "description" },
              { header: "Status", key: "status" },
              { header: "Team Lead", key: "team_lead_name" },
              { header: "Members Count", key: "members", render: p => (p.members||[]).length }
            ]}
          />
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">
            <Plus className="w-3.5 h-3.5"/> New Project
          </motion.button>
        </div>
      </div>

      {/* Project Cards */}
      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : projects.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <FolderKanban className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">No projects yet</p>
          <button onClick={openCreate} className="mt-3 text-xs font-bold text-brand-600 hover:underline">+ Create first project</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p,i)=>{
            const sc = statusCfg[p.status]||statusCfg.active;
            return (
              <motion.div key={p.id||p._id||i} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <FolderKanban className="w-5 h-5 text-brand-600"/>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                      {p.team_lead_name && <p className="text-[10px] text-slate-500 mt-0.5">Lead: {p.team_lead_name}</p>}
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span>
                </div>
                {p.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{p.description}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400"/>
                    <button onClick={()=>setShowMembers(showMembers?.id===p.id?null:p)} className="text-[10px] font-semibold text-slate-600 hover:text-brand-600">
                      {(p.members||[]).length} members
                    </button>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={()=>openEdit(p)} className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center"><Edit className="w-3.5 h-3.5 text-blue-600"/></button>
                    <button onClick={()=>handleArchive(p)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-500"/></button>
                  </div>
                </div>

                {/* Members popover */}
                {showMembers?.id===p.id && (
                  <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}}
                    className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    {(p.members||[]).length===0 && <p className="text-[10px] text-slate-400">No members assigned</p>}
                    {(p.members||[]).map(mId=>{
                      const emp = employees.find(e=>(e.id||e._id)===mId || e.employee_id===mId);
                      return (
                        <div key={mId} className="flex items-center justify-between">
                          <span className="text-xs text-slate-700">{emp?`${emp.first_name} ${emp.last_name}`:mId}</span>
                          <button onClick={()=>handleRemoveMember(p.id||p._id, mId)} className="text-[9px] text-red-400 hover:text-red-600"><UserMinus className="w-3 h-3"/></button>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-2 pt-2">
                      <select value={addMemberId} onChange={e=>setAddMemberId(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-[10px] outline-none">
                        <option value="">Add member...</option>
                        {employees.filter(e=>!(p.members||[]).includes(e.id||e._id)).map(e=><option key={e.id||e._id} value={e.id||e._id}>{e.first_name} {e.last_name}</option>)}
                      </select>
                      <button onClick={()=>handleAddMember(p.id||p._id)} disabled={!addMemberId} className="text-[10px] font-bold text-brand-600 disabled:text-slate-300"><UserPlus className="w-3.5 h-3.5"/></button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreate&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowCreate(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">{editItem?"Edit":"New"} Project</h3><button onClick={()=>setShowCreate(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Project Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required placeholder="HRMS Development" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label><textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Brief project description..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none"/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Team Lead</label>
                  <select value={form.team_lead} onChange={e=>handleLeadChange(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 bg-white">
                    <option value="">Select team lead...</option>
                    {employees.map(e=><option key={e.id||e._id} value={e.employee_id||e.id||e._id}>{e.first_name} {e.last_name} — {e.department}</option>)}
                  </select></div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-2 block">Members ({form.members.length} selected)</label>
                  {/* Department filter + search */}
                  <div className="flex items-center gap-2 mb-2">
                    <select value={memberDept} onChange={e=>setMemberDept(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-[10px] bg-white outline-none focus:border-brand-400">
                      <option value="">All Departments</option>
                      {deptList.map(d=><option key={d.id||d.name} value={d.name}>{d.name}</option>)}
                    </select>
                    <div className="relative flex-1">
                      <input value={memberSearch} onChange={e=>setMemberSearch(e.target.value)} placeholder="Search by name..."
                        className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-[10px] outline-none focus:border-brand-400"/>
                      {memberSearch && <button type="button" onClick={()=>setMemberSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3 h-3"/></button>}
                    </div>
                  </div>
                  {/* Selected chips */}
                  {form.members.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.members.map(mId=>{
                        const emp = employees.find(e=>(e.employee_id||e.id||e._id)===mId);
                        return (
                          <span key={mId} className="flex items-center gap-1 px-2 py-1 rounded-full bg-brand-50 border border-brand-200 text-[10px] font-semibold text-brand-700">
                            {emp?`${emp.first_name} ${emp.last_name}`:mId}
                            <button type="button" onClick={()=>toggleMember(mId)} className="w-3.5 h-3.5 rounded-full bg-brand-200 hover:bg-brand-300 flex items-center justify-center"><X className="w-2 h-2 text-brand-700"/></button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {/* Employee list */}
                  <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-50">
                    {filteredEmps.length===0 ? (
                      <div className="p-4 text-center"><p className="text-[10px] text-slate-400">{memberSearch||memberDept?"No employees match":"No employees available"}</p></div>
                    ) : filteredEmps.map(emp=>{
                      const id = emp.employee_id||emp.id||emp._id;
                      const sel = form.members.includes(id);
                      return (
                        <label key={id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${sel?"bg-brand-50":"hover:bg-slate-50"}`}>
                          <input type="checkbox" checked={sel} onChange={()=>toggleMember(id)} className="w-3.5 h-3.5 rounded border-slate-300 accent-brand-600 flex-shrink-0"/>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{emp.first_name} {emp.last_name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{emp.designation} · {emp.department}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Saving...":editItem?"Update Project":"Create Project"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
