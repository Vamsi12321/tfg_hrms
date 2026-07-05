"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Calendar, Building,
  Briefcase, Edit, Camera, Shield, Key, CheckCircle2,
  AlertCircle, X, Clock, Save, CreditCard, GraduationCap, FileText, ExternalLink
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";
import FileUpload from "@/components/FileUpload";
import {
  getOnboardingProgress, requestEditPermission, listEditRequests,
  checkEditPermission, saveEdit, submitOnboardingSection
} from "@/lib/api";

const sectionLabels = {
  personal_details: "Personal Details",
  address: "Address",
  emergency_contact: "Emergency Contact",
  bank_details: "Bank Details",
  government_ids: "Government IDs",
  education: "Education",
  experience: "Work Experience",
};

export default function MyProfilePage() {
  const { user, openChangePassword } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editRequests, setEditRequests] = useState([]);
  const [toast, setToast] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(null);
  const [requestReason, setRequestReason] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  // Edit mode state
  const [editingSection, setEditingSection] = useState(null);
  const [editRequestId, setEditRequestId] = useState(null);
  const [editData, setEditData] = useState({});
  const [modalError, setModalError] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const [profRes, reqRes] = await Promise.all([
      getOnboardingProgress(),
      listEditRequests({ limit: 20 }),
    ]);
    if (profRes.ok && profRes.data) setProfile(profRes.data);
    if (reqRes.ok && reqRes.data) setEditRequests(reqRes.data.requests || []);
    setLoading(false);
  };

  const handleRequestEdit = async (section) => {
    if (!requestReason.trim()) { setModalError("Please provide a reason"); return; }
    setModalError("");
    setFormLoading(true);
    const res = await requestEditPermission({ section, reason: requestReason });
    if (res.ok) {
      showToast("Edit request submitted! HR will review it.");
      setShowRequestModal(null);
      setRequestReason("");
      fetchProfile();
    } else {
      const errMsg = typeof res.data?.detail === "string" ? res.data.detail :
        Array.isArray(res.data?.detail) ? res.data.detail.map(e => e.msg).join(", ") : "Failed to submit request";
      setModalError(errMsg);
    }
    setFormLoading(false);
  };

  const handleStartEdit = async (section) => {
    const res = await checkEditPermission(section);
    if (res.ok && res.data?.can_edit) {
      setEditingSection(section);
      setEditRequestId(res.data.request_id);
      // Pre-fill edit data from profile
      setEditData(profile[section] || {});
    } else {
      showToast(res.data?.message || "No edit permission. Submit a new request.", "error");
    }
  };

  const handleSaveEdit = async () => {
    if (!editRequestId || !editingSection) return;
    setModalError("");
    setFormLoading(true);
    const res = await saveEdit(editRequestId, editData);
    if (res.ok) {
      showToast("Changes saved successfully!");
      setEditingSection(null);
      setEditRequestId(null);
      fetchProfile();
    } else {
      const errMsg = typeof res.data?.detail === "string" ? res.data.detail :
        Array.isArray(res.data?.detail) ? res.data.detail.map(e => e.msg).join(", ") : "Failed to save — time window may have expired";
      setModalError(errMsg);
    }
    setFormLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Profile" />
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    </div>
  );

  const p = profile || {};
  const pd = p.personal_details || {};
  const addr = p.address || {};
  const ec = p.emergency_contact || {};
  const bank = p.bank_details || {};
  const govIds = p.government_ids || {};
  const edu = p.education?.entries || [];

  // Helper to get edit request status for a section
  const getSectionEditStatus = (section) => {
    const req = editRequests.find(r => r.section === section && (r.status === "pending" || (r.status === "approved" && !r.edit_completed)));
    return req;
  };

  const SectionHeader = ({ section, title, icon: Icon }) => {
    const editReq = getSectionEditStatus(section);
    return (
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Icon className="w-4 h-4 text-brand-500" /> {title}
        </h3>
        <div className="flex items-center gap-2">
          {editReq?.status === "pending" && (
            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" /> Edit Pending
            </span>
          )}
          {editReq?.status === "approved" && (
            <button onClick={() => handleStartEdit(section)}
              className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 flex items-center gap-1">
              <Edit className="w-3 h-3" /> Edit Now
            </button>
          )}
          {!editReq && (
            <button onClick={() => { setShowRequestModal(section); setModalError(""); }}
              className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100 flex items-center gap-1">
              <Edit className="w-3 h-3" /> Request Edit
            </button>
          )}
        </div>
      </div>
    );
  };

  const InfoRow = ({ label, value }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-xs font-medium text-slate-800">{value || "—"}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Profile" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-brand-500/20">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
              {(p.first_name || "E")[0]}{(p.last_name || "")[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{p.first_name} {p.last_name}</h2>
              <p className="text-sm text-white/80">{p.designation} • {p.department}</p>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-white/60">
                <span>ID: {p.employee_id}</span>
                <span>Joined: {p.joining_date}</span>
                <span>{p.work_location}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Personal Details */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <SectionHeader section="personal_details" title="Personal Details" icon={User} />
            <InfoRow label="Date of Birth" value={pd.date_of_birth} />
            <InfoRow label="Gender" value={pd.gender} />
            <InfoRow label="Blood Group" value={pd.blood_group} />
            <InfoRow label="Marital Status" value={pd.marital_status} />
            {pd.resume_url && (
              <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resume / CV</span>
                <a href={pd.resume_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:underline">
                  <FileText className="w-3 h-3"/> View Resume <ExternalLink className="w-2.5 h-2.5"/>
                </a>
              </div>
            )}
          </motion.div>

          {/* Address */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <SectionHeader section="address" title="Address" icon={MapPin} />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current</p>
            <p className="text-xs text-slate-800 mb-3">{addr.current?.line1}, {addr.current?.city}, {addr.current?.state} - {addr.current?.pincode}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Permanent</p>
            <p className="text-xs text-slate-800">{addr.permanent?.line1}, {addr.permanent?.city}, {addr.permanent?.state} - {addr.permanent?.pincode}</p>
          </motion.div>

          {/* Emergency Contact */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <SectionHeader section="emergency_contact" title="Emergency Contact" icon={Phone} />
            <InfoRow label="Name" value={ec.name} />
            <InfoRow label="Relation" value={ec.relation} />
            <InfoRow label="Phone" value={ec.phone} />
          </motion.div>

          {/* Bank Details */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <SectionHeader section="bank_details" title="Bank Details" icon={CreditCard} />
            <InfoRow label="Account No." value={bank.account_number ? `XXXX${bank.account_number.slice(-4)}` : "—"} />
            <InfoRow label="IFSC" value={bank.ifsc} />
            <InfoRow label="Bank" value={bank.bank_name} />
            <InfoRow label="Branch" value={bank.branch} />
            <InfoRow label="Type" value={bank.account_type} />
          </motion.div>

          {/* Government IDs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <SectionHeader section="government_ids" title="Government IDs" icon={Shield} />
            <InfoRow label="PAN" value={govIds.pan?.number ? `${govIds.pan.number.slice(0, 3)}XXXX${govIds.pan.number.slice(-1)}` : "—"} />
            <InfoRow label="Aadhaar" value={govIds.aadhaar?.number ? `XXXX ${govIds.aadhaar.number.slice(-4)}` : "—"} />
            {govIds.passport?.number && <InfoRow label="Passport" value={govIds.passport.number} />}
            {govIds.uan?.number && <InfoRow label="UAN" value={govIds.uan.number} />}
          </motion.div>

          {/* Education */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <SectionHeader section="education" title="Education" icon={GraduationCap} />
            {edu.length === 0 ? <p className="text-xs text-slate-400">No education details</p> : (
              <div className="space-y-3">
                {edu.map((e, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-bold text-slate-800">{e.degree} — {e.institution}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{e.field_of_study} • {e.start_year}–{e.end_year}{e.grade ? ` • Grade: ${e.grade}` : ""}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Edit Requests History */}
        {editRequests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">My Edit Requests</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {editRequests.map((req, i) => {
                const statusMap = {
                  pending: { cls: "bg-amber-50 text-amber-600 border-amber-200", label: "Pending" },
                  approved: { cls: "bg-green-50 text-green-600 border-green-200", label: "Approved" },
                  rejected: { cls: "bg-red-50 text-red-600 border-red-200", label: "Rejected" },
                  expired: { cls: "bg-slate-50 text-slate-500 border-slate-200", label: "Expired" },
                };
                const sc = statusMap[req.status] || statusMap.pending;
                return (
                  <div key={req.id || i} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800">{sectionLabels[req.section] || req.section}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{req.reason}</p>
                      {req.edit_allowed_until && req.status === "approved" && (
                        <p className="text-[10px] text-green-600 mt-0.5">
                          Edit until: {new Date(req.edit_allowed_until).toLocaleString()}
                        </p>
                      )}
                      {req.rejection_reason && (
                        <p className="text-[10px] text-red-500 mt-0.5">Reason: {req.rejection_reason}</p>
                      )}
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
                    {req.status === "approved" && !req.edit_completed && (
                      <button onClick={() => handleStartEdit(req.section)}
                        className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100">
                        Edit Now
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Security Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Security</h3>
          <button onClick={openChangePassword}
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all w-full text-left">
            <Key className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Change Password</p>
              <p className="text-[10px] text-slate-400">Update your account password</p>
            </div>
          </button>
        </motion.div>
      </div>

      {/* Request Edit Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRequestModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Request Edit Permission</h3>
                <button onClick={() => setShowRequestModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Request permission to edit <strong>{sectionLabels[showRequestModal]}</strong>. HR will review and approve with a time window for you to make changes.
              </p>
              {modalError && (
                <div className="p-3 mb-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-red-700 flex-1">{modalError}</p>
                </div>
              )}
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason for edit *</label>
                <textarea rows={3} value={requestReason} onChange={e => setRequestReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none"
                  placeholder="Why do you need to edit this section?" />
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} disabled={formLoading}
                onClick={() => handleRequestEdit(showRequestModal)}
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                {formLoading ? "Submitting..." : "Submit Request"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Section Modal */}
      <AnimatePresence>
        {editingSection && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingSection(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Edit {sectionLabels[editingSection]}</h3>
                <button onClick={() => setEditingSection(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="p-3 mb-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                Save your changes within the approved time window.
              </div>
              {modalError && (
                <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-red-700 flex-1">{modalError}</p>
                </div>
              )}
              {/* Dynamic form based on section */}
              <div className="space-y-4">
                {editingSection === "bank_details" && (
                  <>
                    <Input label="Account Number" value={editData.account_number || ""} onChange={v => setEditData(d => ({ ...d, account_number: v }))} />
                    <Input label="IFSC Code" value={editData.ifsc || ""} onChange={v => setEditData(d => ({ ...d, ifsc: v.toUpperCase() }))} />
                    <Input label="Bank Name" value={editData.bank_name || ""} onChange={v => setEditData(d => ({ ...d, bank_name: v }))} />
                    <Input label="Branch" value={editData.branch || ""} onChange={v => setEditData(d => ({ ...d, branch: v }))} />
                  </>
                )}
                {editingSection === "emergency_contact" && (
                  <>
                    <Input label="Name" value={editData.name || ""} onChange={v => setEditData(d => ({ ...d, name: v }))} />
                    <Input label="Relation" value={editData.relation || ""} onChange={v => setEditData(d => ({ ...d, relation: v }))} />
                    <Input label="Phone" value={editData.phone || ""} onChange={v => setEditData(d => ({ ...d, phone: v }))} />
                  </>
                )}
                {editingSection === "personal_details" && (
                  <>
                    <Input label="Date of Birth" type="date" value={editData.date_of_birth || ""} onChange={v => setEditData(d => ({ ...d, date_of_birth: v }))} />
                    <Input label="Blood Group" value={editData.blood_group || ""} onChange={v => setEditData(d => ({ ...d, blood_group: v }))} />
                    <Input label="Marital Status" value={editData.marital_status || ""} onChange={v => setEditData(d => ({ ...d, marital_status: v }))} />
                    {/* Resume upload */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Resume / CV</label>
                      {editData.resume_url && (
                        <div className="flex items-center gap-2 mb-2 p-2.5 rounded-xl bg-brand-50 border border-brand-200">
                          <FileText className="w-4 h-4 text-brand-500 flex-shrink-0"/>
                          <a href={editData.resume_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-semibold text-brand-600 hover:underline flex-1 truncate flex items-center gap-1">
                            Current Resume <ExternalLink className="w-3 h-3 flex-shrink-0"/>
                          </a>
                        </div>
                      )}
                      <FileUpload
                        label="Upload New Resume"
                        category="other"
                        onUploadComplete={(url) => setEditData(d => ({ ...d, resume_url: url }))}
                      />
                      {editData.resume_url && (
                        <p className="text-[10px] text-green-600 mt-1.5 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3"/> New resume ready — click Save Changes
                        </p>
                      )}
                    </div>
                  </>
                )}
                {editingSection === "address" && (
                  <>
                    <p className="text-xs font-bold text-slate-600">Current Address</p>
                    <Input label="Street" value={editData.current?.line1 || ""} onChange={v => setEditData(d => ({ ...d, current: { ...d.current, line1: v } }))} />
                    <Input label="City" value={editData.current?.city || ""} onChange={v => setEditData(d => ({ ...d, current: { ...d.current, city: v } }))} />
                    <Input label="State" value={editData.current?.state || ""} onChange={v => setEditData(d => ({ ...d, current: { ...d.current, state: v } }))} />
                    <Input label="Pincode" value={editData.current?.pincode || ""} onChange={v => setEditData(d => ({ ...d, current: { ...d.current, pincode: v } }))} />
                    <p className="text-xs font-bold text-slate-600 pt-2">Permanent Address</p>
                    <Input label="Street" value={editData.permanent?.line1 || ""} onChange={v => setEditData(d => ({ ...d, permanent: { ...d.permanent, line1: v } }))} />
                    <Input label="City" value={editData.permanent?.city || ""} onChange={v => setEditData(d => ({ ...d, permanent: { ...d.permanent, city: v } }))} />
                    <Input label="State" value={editData.permanent?.state || ""} onChange={v => setEditData(d => ({ ...d, permanent: { ...d.permanent, state: v } }))} />
                    <Input label="Pincode" value={editData.permanent?.pincode || ""} onChange={v => setEditData(d => ({ ...d, permanent: { ...d.permanent, pincode: v } }))} />
                  </>
                )}
                {editingSection === "government_ids" && (
                  <>
                    <Input label="PAN Number" value={editData.pan?.number || ""} onChange={v => setEditData(d => ({ ...d, pan: { ...d.pan, number: v.toUpperCase() } }))} />
                    <Input label="Aadhaar Number" value={editData.aadhaar?.number || ""} onChange={v => setEditData(d => ({ ...d, aadhaar: { ...d.aadhaar, number: v } }))} />
                  </>
                )}
                {/* Fallback for other sections */}
                {!["bank_details", "emergency_contact", "personal_details", "address", "government_ids"].includes(editingSection) && (
                  <p className="text-xs text-slate-500">Edit form for this section. Update below and save.</p>
                )}
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} disabled={formLoading}
                onClick={handleSaveEdit}
                className="w-full mt-5 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 disabled:opacity-70 flex items-center justify-center gap-2">
                {formLoading ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reusable input component
function Input({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
    </div>
  );
}
