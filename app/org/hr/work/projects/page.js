"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban, Plus, Users, Edit, Trash2, X, Search,
  CheckCircle2, AlertCircle, UserPlus, UserMinus, RefreshCw
} from "lucide-react";
import { createProject, updateProject, archiveProject,
  addProjectMember, removeProjectMember } from "@/lib/api";
import { useProjects, useEmployees, useDepartments, useInvalidate } from "@/lib/queries";
import ExportButton from "@/components/ExportButton";

const statusCfg = {
  active:    { cls: "bg-emerald-50 text-emerald-700 border-emerald-200/50 shadow-sm shadow-emerald-500/10",  label: "Active", bgIcon: "bg-emerald-50/80 text-emerald-600 border-emerald-100/50" },
  completed: { cls: "bg-blue-50 text-blue-700 border-blue-200/50 shadow-sm shadow-blue-500/10",     label: "Completed", bgIcon: "bg-blue-50/80 text-blue-600 border-blue-100/50" },
  archived:  { cls: "bg-slate-50 text-slate-500 border-slate-200/50 shadow-sm",  label: "Archived", bgIcon: "bg-slate-50 text-slate-400 border-slate-200/50" },
};

export default function ProjectsPage() {
  const invalidate = useInvalidate();
  const { data: projData, isLoading } = useProjects();
  const projects = projData?.projects || [];
  const { data: empData } = useEmployees({ limit: 100 });
  const employees = empData?.employees || [];
  const { data: deptList = [] } = useDepartments();

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm] = useState({ name:"", description:"", team_lead:"", members:[] });
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showMembers, setShowMembers] = useState(null);
  const [addMemberId, setAddMemberId] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberDept, setMemberDept] = useState("");

  const showToast = (msg, type = "success") => { setToast({msg, type}); setTimeout(() => setToast(null), 4000); };

  const openCreate = () => { setForm({ name:"", description:"", team_lead:"", members:[] }); setEditItem(null); setShowCreate(true); };
  const openEdit = (p) => { setForm({ name: p.name, description: p.description||"", team_lead: p.team_lead||"", members: p.members||[] }); setEditItem(p); setShowCreate(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const payload = { name: form.name, description: form.description || undefined, team_lead: form.team_lead || undefined, members: form.members.length > 0 ? form.members : undefined };
    const res = editItem ? await updateProject(editItem.id || editItem._id, payload) : await createProject(payload);
    if (res.ok) { showToast(editItem ? "Project updated" : "Project created"); setShowCreate(false); invalidate("projects"); }
    else showToast(typeof res.data?.detail === "string" ? res.data.detail : "Failed", "error");
    setFormLoading(false);
  };

  const handleArchive = async (p) => {
    if (!confirm(`Archive "${p.name}"?`)) return;
    const res = await archiveProject(p.id || p._id);
    if (res.ok) { showToast("Project archived"); invalidate("projects"); }
    else showToast("Failed", "error");
  };

  const handleAddMember = async (projectId) => {
    if (!addMemberId) return;
    const res = await addProjectMember(projectId, addMemberId);
    if (res.ok) { showToast("Member added"); setAddMemberId(""); invalidate("projects"); }
    else showToast(typeof res.data?.detail === "string" ? res.data.detail : "Failed", "error");
  };

  const handleRemoveMember = async (projectId, empId) => {
    const res = await removeProjectMember(projectId, empId);
    if (res.ok) { showToast("Member removed"); invalidate("projects"); }
    else showToast("Failed", "error");
  };

  const filteredEmps = employees.filter(e => {
    const name = `${e.first_name} ${e.last_name}`.toLowerCase();
    const matchSearch = !memberSearch || name.includes(memberSearch.toLowerCase()) || (e.department || "").toLowerCase().includes(memberSearch.toLowerCase());
    const matchDept = !memberDept || e.department === memberDept;
    const id = e.employee_id || e.id || e._id;
    const isSelectedLead = form.team_lead && id === form.team_lead;
    return matchSearch && matchDept && !isSelectedLead;
  });

  const toggleMember = (empId) => {
    setForm(f => ({ ...f, members: f.members.includes(empId) ? f.members.filter(m => m !== empId) : [...f.members, empId] }));
  };

  const handleLeadChange = (leadId) => {
    setForm(f => ({ ...f, team_lead: leadId, members: f.members.filter(m => m !== leadId) }));
  };

  const activeCount = projects.filter(p => p.status === 'active' || !p.status).length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const archivedCount = projects.filter(p => p.status === 'archived').length;

  return (
    <div className="space-y-5 pb-10">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Projects Workspace</h3>
          <p className="text-sm text-slate-500">Manage internal and client projects</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => invalidate("projects")} title="Refresh Data"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
          </button>
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
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25">
            <Plus className="w-4 h-4" /> New Project
          </motion.button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Projects", value: projects.length, color: "text-slate-900", bg: "bg-white", border: "border-slate-100", dot: "bg-brand-500" },
          { label: "Active", value: activeCount, color: "text-emerald-700", bg: "bg-emerald-50/60", border: "border-emerald-200/50", dot: "bg-emerald-500" },
          { label: "Completed", value: completedCount, color: "text-blue-700", bg: "bg-blue-50/60", border: "border-blue-200/50", dot: "bg-blue-500" },
          { label: "Archived", value: archivedCount, color: "text-slate-700", bg: "bg-slate-50/60", border: "border-slate-200/50", dot: "bg-slate-400" },
        ].map(k => (
          <div key={k.label} className={`${k.bg} border ${k.border} rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm`}>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</p>
              <p className={`text-2xl font-black ${k.color} mt-1`}>{k.value}</p>
            </div>
            <span className={`w-3 h-3 rounded-full ${k.dot}`} />
          </div>
        ))}
      </div>

      {/* Project Cards */}
      {isLoading ? (
        <div className="p-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-700">No projects yet</p>
          <button onClick={openCreate} className="mt-3 text-xs font-bold text-brand-600 hover:underline">+ Create first project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p, i) => {
            const sc = statusCfg[p.status || 'active'] || statusCfg.active;
            const initials = p.name.substring(0, 2).toUpperCase();
            return (
              <motion.div key={p.id || p._id || i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-100 transition-all group flex flex-col h-full">
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-brand-500 to-indigo-600 text-white font-bold shadow-sm`}>
                      {initials}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">{p.name}</h4>
                      {p.team_lead_name ? (
                        <p className="text-[10px] font-semibold text-slate-500 mt-0.5 line-clamp-1">Lead: {p.team_lead_name}</p>
                      ) : (
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5 italic">No lead assigned</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${sc.cls}`}>
                    {sc.label}
                  </span>
                </div>

                <div className="flex-1">
                  {p.description ? (
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{p.description}</p>
                  ) : (
                    <p className="text-xs text-slate-400 mb-4 italic">No description provided.</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                  <button onClick={() => setShowMembers(showMembers?.id === p.id ? null : p)} 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-brand-50 hover:text-brand-700 text-[10px] font-bold text-slate-600 transition-colors">
                    <Users className="w-3.5 h-3.5" />
                    {(p.members || []).length} Member{(p.members || []).length !== 1 ? 's' : ''}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    {p.status !== 'archived' && (
                      <button onClick={() => handleArchive(p)} className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Members popover */}
                <AnimatePresence>
                  {showMembers?.id === p.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-100 overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Team Members</p>
                      <div className="space-y-2 mb-3 max-h-32 overflow-y-auto pr-1">
                        {(p.members || []).length === 0 && <p className="text-[10px] font-medium text-slate-400 italic">No members assigned</p>}
                        {(p.members || []).map(mId => {
                          const emp = employees.find(e => (e.id || e._id) === mId || e.employee_id === mId);
                          return (
                            <div key={mId} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                  {emp ? emp.first_name[0]+emp.last_name[0] : "?"}
                                </div>
                                <span className="text-xs font-semibold text-slate-700 truncate">{emp ? `${emp.first_name} ${emp.last_name}` : mId}</span>
                              </div>
                              <button onClick={() => handleRemoveMember(p.id || p._id, mId)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                <UserMinus className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-brand-50/50 border border-brand-100/50">
                        <select value={addMemberId} onChange={e => setAddMemberId(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium bg-white outline-none focus:border-brand-400 transition-all cursor-pointer">
                          <option value="">Add new member...</option>
                          {employees.filter(e => !(p.members || []).includes(e.id || e._id)).map(e => <option key={e.id || e._id} value={e.id || e._id}>{e.first_name} {e.last_name}</option>)}
                        </select>
                        <button onClick={() => handleAddMember(p.id || p._id)} disabled={!addMemberId} className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center disabled:opacity-50 transition-all">
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Create/Edit Project Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
              
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100/50 flex items-center justify-center">
                    <FolderKanban className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{editItem ? "Edit Project" : "New Project"}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Project details and team members</p>
                  </div>
                </div>
                <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-xl hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-5">
                <form id="project-form" onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Project Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="HRMS Development" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
                    <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief project overview..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all bg-white resize-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Team Lead</label>
                    <select value={form.team_lead} onChange={e => handleLeadChange(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white cursor-pointer transition-all">
                      <option value="">Select team lead...</option>
                      {employees.map(e => <option key={e.id || e._id} value={e.employee_id || e.id || e._id}>{e.first_name} {e.last_name} — {e.department || "No Dept"}</option>)}
                    </select>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Team Members</span>
                      <span className="bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">{form.members.length} selected</span>
                    </label>
                    
                    {/* Department filter + search */}
                    <div className="flex items-center gap-2 mb-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                      <select value={memberDept} onChange={e => setMemberDept(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-[10px] font-bold bg-white outline-none focus:border-brand-400 cursor-pointer w-1/3">
                        <option value="">All Depts</option>
                        {deptList.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
                      </select>
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search team members..."
                          className="w-full pl-8 pr-8 py-2 rounded-lg border border-slate-200 text-[10px] outline-none focus:border-brand-400 font-semibold" />
                        {memberSearch && <button type="button" onClick={() => setMemberSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>}
                      </div>
                    </div>

                    {/* Selected chips */}
                    <AnimatePresence>
                      {form.members.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-2 mb-3 overflow-hidden">
                          {form.members.map(mId => {
                            const emp = employees.find(e => (e.employee_id || e.id || e._id) === mId);
                            return (
                              <span key={mId} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-[10px] font-bold text-brand-700 shadow-sm transition-all">
                                {emp ? `${emp.first_name} ${emp.last_name}` : mId}
                                <button type="button" onClick={() => toggleMember(mId)} className="w-4 h-4 rounded-full bg-brand-200 hover:bg-brand-300 flex items-center justify-center transition-colors"><X className="w-2.5 h-2.5 text-brand-700" /></button>
                              </span>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Employee list */}
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 custom-scrollbar">
                      {filteredEmps.length === 0 ? (
                        <div className="p-6 text-center">
                          <p className="text-xs font-semibold text-slate-500">{memberSearch || memberDept ? "No employees match your search" : "No employees available"}</p>
                        </div>
                      ) : filteredEmps.map(emp => {
                        const id = emp.employee_id || emp.id || emp._id;
                        const sel = form.members.includes(id);
                        return (
                          <label key={id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${sel ? "bg-brand-50/50 hover:bg-brand-50" : "hover:bg-slate-50"}`}>
                            <div className="flex-shrink-0 relative">
                              <input type="checkbox" checked={sel} onChange={() => toggleMember(id)} className="w-4 h-4 rounded-md border-slate-300 text-brand-600 focus:ring-brand-500/20 transition-all cursor-pointer" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate transition-colors ${sel ? "text-brand-900" : "text-slate-700"}`}>{emp.first_name} {emp.last_name}</p>
                              <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{emp.designation} · {emp.department || "No Dept"}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 flex gap-3 bg-slate-50">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-white transition-colors">
                  Cancel
                </button>
                <motion.button type="submit" form="project-form" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 disabled:opacity-70 flex items-center justify-center gap-2">
                  {formLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><CheckCircle2 className="w-4 h-4" /> {editItem ? "Update Project" : "Create Project"}</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
