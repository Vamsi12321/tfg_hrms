"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, MapPin, Heart, CreditCard, Shield, GraduationCap,
  Briefcase, CheckCircle2, Clock, AlertCircle,
  ChevronRight, ChevronLeft, Save, Upload, X, Sparkles,
  AlertTriangle, PartyPopper
} from "lucide-react";
import TopBar from "@/components/TopBar";
import FileUpload from "@/components/FileUpload";
import { submitOnboardingSection } from "@/lib/api";
import { useOnboardingProgress, useInvalidate } from "@/lib/queries";

const steps = [
  { key:"personal_details",  label:"Personal Details",  icon:User,           desc:"Basic personal info" },
  { key:"address",           label:"Address",           icon:MapPin,         desc:"Current & permanent" },
  { key:"emergency_contact", label:"Emergency Contact", icon:Heart,          desc:"In case of emergency" },
  { key:"bank_details",      label:"Bank Details",      icon:CreditCard,     desc:"For salary disbursement", critical:true },
  { key:"government_ids",    label:"Government IDs",    icon:Shield,         desc:"PAN & Aadhaar", critical:true },
  { key:"education",         label:"Education",         icon:GraduationCap,  desc:"Academic background" },
  { key:"experience",        label:"Work Experience",   icon:Briefcase,      desc:"Previous employment" },
  { key:"policy_acceptance", label:"Company Policies",  icon:CheckCircle2,   desc:"Review & accept" },
];

export default function OnboardingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress]     = useState(0);
  const [sections, setSections]     = useState({});
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);
  const [hrNotes, setHrNotes]       = useState(null);
  const [isFresher, setIsFresher]   = useState(false);

  const [personal, setPersonal]     = useState({ date_of_birth:"", gender:"male", blood_group:"", marital_status:"single" });
  const [address, setAddress]       = useState({ current:{ line1:"", city:"", state:"", pincode:"" }, permanent:{ line1:"", city:"", state:"", pincode:"" } });
  const [emergency, setEmergency]   = useState({ name:"", relation:"", phone:"" });
  const [bank, setBank]             = useState({ account_number:"", ifsc:"", bank_name:"", branch:"", account_type:"savings" });
  const [govIds, setGovIds]         = useState({ pan:{ number:"", document_url:"" }, aadhaar:{ number:"", document_url:"" }, passport:{ number:"", document_url:"" }, uan:{ number:"", document_url:"" } });
  const [education, setEducation]   = useState([{ degree:"", institution:"", field_of_study:"", start_year:"", end_year:"", grade:"" }]);
  const [experience, setExperience] = useState([{ company:"", designation:"", start_date:"", end_date:"", is_current:false }]);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  const invalidate = useInvalidate();
  const { data: onboardingData, isLoading: loading } = useOnboardingProgress();

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(()=>setToast(null), 4000); };

  // Pre-fill form fields from API data
  useEffect(() => {
    if (!onboardingData) return;
    setProgress(onboardingData.progress || 0);
    setSections(onboardingData.sections || {});
    setHrNotes(onboardingData.hr_notes || null);
    setIsFresher(onboardingData.is_fresher === true);

    if (onboardingData.personal_details) {
      setPersonal(p => ({ ...p, ...onboardingData.personal_details }));
    }
    if (onboardingData.address) {
      setAddress(a => ({
        current: { ...a.current, ...(onboardingData.address.current || {}) },
        permanent: { ...a.permanent, ...(onboardingData.address.permanent || {}) },
      }));
    }
    if (onboardingData.emergency_contact) {
      setEmergency(e => ({ ...e, ...onboardingData.emergency_contact }));
    }
    if (onboardingData.bank_details) {
      setBank(b => ({ ...b, ...onboardingData.bank_details }));
    }
    if (onboardingData.government_ids) {
      const ids = onboardingData.government_ids;
      setGovIds(g => ({
        pan: { ...g.pan, ...(ids.pan || {}) },
        aadhaar: { ...g.aadhaar, ...(ids.aadhaar || {}) },
        passport: { ...g.passport, ...(ids.passport || {}) },
        uan: { ...g.uan, ...(ids.uan || {}) },
      }));
    }
    if (onboardingData.education?.entries?.length > 0) {
      setEducation(onboardingData.education.entries);
    }
    if (onboardingData.experience?.entries?.length > 0) {
      setExperience(onboardingData.experience.entries);
    }
    if (onboardingData.policy_acceptance?.accepted) {
      setPolicyAccepted(true);
    }
  }, [onboardingData]);

  const handleSubmit = async (sectionKey, data) => {
    setSaving(true);
    try {
      const res = await submitOnboardingSection(sectionKey, data);
      if (res.ok) {
        showToast(`${steps.find(s=>s.key===sectionKey)?.label} saved!`);
        setProgress(res.data?.overall_progress || progress + 11);
        setSections(prev => ({ ...prev, [sectionKey]: { status:"completed", verified:false } }));
        invalidate("onboarding");
        if (activeStep < visibleSteps.length - 1) setTimeout(() => setActiveStep(activeStep + 1), 500);
      } else {
        showToast(res.data?.detail?.[0]?.msg || res.data?.detail || "Failed to save", "error");
      }
    } catch { showToast("Network error", "error"); }
    setSaving(false);
  };

  // Validation for required fields per section
  const validateSection = (key) => {
    switch (key) {
      case "personal_details":
        if (!personal.date_of_birth) return "Date of Birth is required";
        if (!personal.gender) return "Gender is required";
        return null;
      case "address":
        if (!address.current.line1 || !address.current.city || !address.current.state || !address.current.pincode)
          return "All current address fields are required (Street, City, State, Pincode)";
        if (!address.permanent.line1 || !address.permanent.city || !address.permanent.state || !address.permanent.pincode)
          return "All permanent address fields are required";
        return null;
      case "emergency_contact":
        if (!emergency.name) return "Emergency contact name is required";
        if (!emergency.relation) return "Relation is required";
        if (!emergency.phone) return "Phone number is required";
        return null;
      case "bank_details":
        if (!bank.account_number) return "Account number is required";
        if (!bank.ifsc) return "IFSC code is required";
        if (!bank.bank_name) return "Bank name is required";
        return null;
      case "government_ids":
        if (!govIds.pan.number) return "PAN number is required";
        if (!govIds.aadhaar.number) return "Aadhaar number is required";
        return null;
      case "education":
        if (education.filter(e => e.degree && e.institution).length === 0)
          return "At least one education entry with degree and institution is required";
        return null;
      case "experience":
        return null; // Optional for freshers, handled separately
      default:
        return null;
    }
  };

  // Show all steps, but mark experience as not applicable for freshers
  const visibleSteps = steps;
  const currentStep = visibleSteps[activeStep];
  const isStepDisabled = (step) => isFresher && step.key === "experience";
  const isOnboardingComplete = progress >= 100;

  if (loading) return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  // Common input class
  const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all bg-white";
  const labelCls = "text-xs font-semibold text-slate-600 mb-1.5 block";

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title={isOnboardingComplete ? "Onboarding Complete" : "Complete Your Onboarding"} />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.type==="error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Complete Banner */}
      {isOnboardingComplete && (
        <div className="p-6 pb-0">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-xl shadow-green-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <PartyPopper className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Onboarding Complete!</h2>
                  <p className="text-sm text-green-100 mt-0.5">All sections submitted. Your HR team will review and verify your details.</p>
                  <p className="text-xs text-green-200 mt-1">Need to make changes? Go to <a href="/org/employee/profile" className="underline font-bold text-white">My Profile</a> and request an edit.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="p-6">
        <div className="flex gap-6 max-w-6xl mx-auto">

          {/* Left Sidebar — Steps */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Progress Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700">Progress</span>
                  <span className={`text-sm font-black ${progress>=100?"text-green-600":progress>=50?"text-brand-600":"text-amber-600"}`}>{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div animate={{ width:`${progress}%` }} transition={{ duration:0.8 }}
                    className={`h-full rounded-full ${progress>=100?"bg-green-500":progress>=50?"bg-brand-500":"bg-amber-500"}`} />
                </div>
                {progress >= 100 && (
                  <p className="text-[10px] text-green-600 font-semibold mt-2 flex items-center gap-1">
                    <PartyPopper className="w-3 h-3" /> All sections complete! Awaiting HR approval.
                  </p>
                )}
              </div>

              {/* HR Notes */}
              {hrNotes && (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                  <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1 mb-1"><AlertTriangle className="w-3 h-3" /> HR Feedback</p>
                  <p className="text-xs text-amber-800">{hrNotes}</p>
                </div>
              )}

              {/* Steps List */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {visibleSteps.map((step, i) => {
                  const Icon = step.icon;
                  const sec = sections[step.key];
                  const isDone = sec?.status === "completed";
                  const needsRevision = sec?.status === "needs_revision";
                  const isActive = i === activeStep;
                  const disabled = isStepDisabled(step);
                  const isNA = sec?.status === "not_applicable" || disabled;
                  return (
                    <button key={step.key} onClick={() => {
                      // Allow clicking on any completed section or any previous section, block skipping forward to uncompleted
                      const sec = sections[step.key];
                      const isDoneSec = sec?.status === "completed" || sec?.status === "not_applicable";
                      if (!disabled && (isDoneSec || i <= activeStep)) setActiveStep(i);
                      else if (!disabled) showToast("Complete the current section first", "error");
                    }} disabled={disabled}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-l-3 ${
                        disabled ? "bg-slate-50/80 border-l-slate-300 opacity-60 cursor-not-allowed" :
                        isActive ? "bg-brand-50 border-l-brand-600" :
                        isDone ? "bg-green-50/50 border-l-green-500" :
                        needsRevision ? "bg-red-50/50 border-l-red-400" :
                        "border-l-transparent hover:bg-slate-50"
                      } ${i !== visibleSteps.length-1 ? "border-b border-slate-50" : ""}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        disabled ? "bg-slate-200" : isDone ? "bg-green-100" : needsRevision ? "bg-red-100" : isActive ? "bg-brand-100" : "bg-slate-100"
                      }`}>
                        {disabled ? <Icon className="w-4 h-4 text-slate-400" /> :
                         isDone ? <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                         needsRevision ? <AlertTriangle className="w-4 h-4 text-red-500" /> :
                         <Icon className={`w-4 h-4 ${isActive ? "text-brand-600" : "text-slate-400"}`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${disabled ? "text-slate-400" : isActive ? "text-brand-700" : isDone ? "text-green-700" : "text-slate-700"}`}>{step.label}</p>
                        <p className="text-[10px] text-slate-400 truncate">{disabled ? "Not applicable (Fresher)" : step.desc}</p>
                      </div>
                      {disabled && (
                        <span className="text-[8px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full">N/A</span>
                      )}
                      {!disabled && step.critical && !isDone && (
                        <span className="text-[8px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">⚠️</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right — Form Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile progress */}
            <div className="lg:hidden mb-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Step {activeStep+1}/{visibleSteps.length}</span>
                <span className={`text-xs font-black ${progress>=100?"text-green-600":"text-brand-600"}`}>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${progress>=100?"bg-green-500":"bg-brand-500"}`} style={{ width:`${progress}%` }} />
              </div>
            </div>

            {/* Step Header */}
            <AnimatePresence mode="wait">
              <motion.div key={activeStep} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }} transition={{ duration:0.25 }}>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Section header */}
                  <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        sections[currentStep.key]?.status==="completed" ? "bg-green-100" : "bg-brand-100"
                      }`}>
                        {sections[currentStep.key]?.status==="completed" ?
                          <CheckCircle2 className="w-6 h-6 text-green-600" /> :
                          <currentStep.icon className="w-6 h-6 text-brand-600" />}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">{currentStep.label}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{currentStep.desc}
                          {currentStep.critical && <span className="ml-2 text-amber-600 font-bold">⚠️ Critical for verification</span>}
                        </p>
                      </div>
                      {sections[currentStep.key]?.status==="completed" && (
                        <span className="ml-auto text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">✓ Submitted</span>
                      )}
                      {sections[currentStep.key]?.status==="needs_revision" && (
                        <span className="ml-auto text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full">⚠ Needs Revision</span>
                      )}
                    </div>
                  </div>

                  {/* Form Content */}
                  <div className="p-6">
                    {/* Personal Details */}
                    {currentStep.key === "personal_details" && (
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div><label className={labelCls}>Date of Birth *</label><input type="date" value={personal.date_of_birth} onChange={e=>setPersonal(p=>({...p,date_of_birth:e.target.value}))} className={inputCls} /></div>
                        <div><label className={labelCls}>Gender *</label><select value={personal.gender} onChange={e=>setPersonal(p=>({...p,gender:e.target.value}))} className={inputCls}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                        <div><label className={labelCls}>Blood Group</label><select value={personal.blood_group} onChange={e=>setPersonal(p=>({...p,blood_group:e.target.value}))} className={inputCls}><option value="">Select</option>{["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(g=><option key={g}>{g}</option>)}</select></div>
                        <div><label className={labelCls}>Marital Status</label><select value={personal.marital_status} onChange={e=>setPersonal(p=>({...p,marital_status:e.target.value}))} className={inputCls}><option value="single">Single</option><option value="married">Married</option><option value="divorced">Divorced</option></select></div>
                      </div>
                    )}

                    {/* Address */}
                    {currentStep.key === "address" && (
                      <div className="space-y-6">
                        <div>
                          <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-brand-500" /> Current Address</p>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2"><label className={labelCls}>Street / Flat No. *</label><input placeholder="e.g. Flat 302, Sapphire Towers" value={address.current.line1} onChange={e=>setAddress(a=>({...a,current:{...a.current,line1:e.target.value}}))} className={inputCls} /></div>
                            <div><label className={labelCls}>City *</label><input placeholder="Hyderabad" value={address.current.city} onChange={e=>setAddress(a=>({...a,current:{...a.current,city:e.target.value}}))} className={inputCls} /></div>
                            <div><label className={labelCls}>State *</label><input placeholder="Telangana" value={address.current.state} onChange={e=>setAddress(a=>({...a,current:{...a.current,state:e.target.value}}))} className={inputCls} /></div>
                            <div><label className={labelCls}>Pincode *</label><input placeholder="500081" value={address.current.pincode} onChange={e=>setAddress(a=>({...a,current:{...a.current,pincode:e.target.value}}))} className={inputCls} /></div>
                          </div>
                        </div>
                        <div className="border-t border-slate-100 pt-5">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-slate-700 flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Permanent Address</p>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" onChange={e => {
                                if (e.target.checked) setAddress(a => ({...a, permanent: {...a.current}}));
                              }} className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                              <span className="text-[10px] font-semibold text-brand-600">Same as current address</span>
                            </label>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2"><label className={labelCls}>Street *</label><input placeholder="e.g. H.No 45, MG Road" value={address.permanent.line1} onChange={e=>setAddress(a=>({...a,permanent:{...a.permanent,line1:e.target.value}}))} className={inputCls} /></div>
                            <div><label className={labelCls}>City *</label><input value={address.permanent.city} onChange={e=>setAddress(a=>({...a,permanent:{...a.permanent,city:e.target.value}}))} className={inputCls} /></div>
                            <div><label className={labelCls}>State *</label><input value={address.permanent.state} onChange={e=>setAddress(a=>({...a,permanent:{...a.permanent,state:e.target.value}}))} className={inputCls} /></div>
                            <div><label className={labelCls}>Pincode *</label><input value={address.permanent.pincode} onChange={e=>setAddress(a=>({...a,permanent:{...a.permanent,pincode:e.target.value}}))} className={inputCls} /></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Emergency Contact */}
                    {currentStep.key === "emergency_contact" && (
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div><label className={labelCls}>Full Name *</label><input placeholder="e.g. Suresh Verma" value={emergency.name} onChange={e=>setEmergency(p=>({...p,name:e.target.value}))} className={inputCls} /></div>
                        <div><label className={labelCls}>Relation *</label><input placeholder="e.g. Father, Spouse" value={emergency.relation} onChange={e=>setEmergency(p=>({...p,relation:e.target.value}))} className={inputCls} /></div>
                        <div><label className={labelCls}>Phone Number *</label><input placeholder="+919876543210" value={emergency.phone} onChange={e=>setEmergency(p=>({...p,phone:e.target.value}))} className={inputCls} /></div>
                      </div>
                    )}

                    {/* Bank Details */}
                    {currentStep.key === "bank_details" && (
                      <div className="space-y-5">
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800">This is critical information for salary disbursement. Double-check before submitting.</p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div><label className={labelCls}>Account Number *</label><input placeholder="123456789012" value={bank.account_number} onChange={e=>setBank(p=>({...p,account_number:e.target.value}))} className={`${inputCls} font-mono`} /></div>
                          <div><label className={labelCls}>IFSC Code *</label><input placeholder="HDFC0001234" value={bank.ifsc} onChange={e=>setBank(p=>({...p,ifsc:e.target.value.toUpperCase()}))} className={`${inputCls} font-mono uppercase`} /></div>
                          <div><label className={labelCls}>Bank Name *</label><input placeholder="HDFC Bank" value={bank.bank_name} onChange={e=>setBank(p=>({...p,bank_name:e.target.value}))} className={inputCls} /></div>
                          <div><label className={labelCls}>Branch</label><input placeholder="Madhapur" value={bank.branch} onChange={e=>setBank(p=>({...p,branch:e.target.value}))} className={inputCls} /></div>
                          <div><label className={labelCls}>Account Type</label><select value={bank.account_type} onChange={e=>setBank(p=>({...p,account_type:e.target.value}))} className={inputCls}><option value="savings">Savings</option><option value="current">Current</option></select></div>
                        </div>
                      </div>
                    )}

                    {/* Government IDs */}
                    {currentStep.key === "government_ids" && (
                      <div className="space-y-5">
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800">Critical for compliance & BGV. Upload clear scanned copies.</p>
                        </div>
                        {/* PAN */}
                        <div>
                          <p className="text-xs font-bold text-slate-700 mb-3">PAN Card *</p>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div><label className={labelCls}>PAN Number</label><input placeholder="ABCDE1234F" value={govIds.pan.number} onChange={e=>setGovIds(p=>({...p,pan:{...p.pan,number:e.target.value.toUpperCase()}}))} className={`${inputCls} font-mono uppercase`} maxLength={10} /></div>
                            <FileUpload label="PAN Card Scan" category="pan" onUploadComplete={(url) => setGovIds(p=>({...p,pan:{...p.pan,document_url:url}}))} />
                          </div>
                        </div>
                        {/* Aadhaar */}
                        <div className="border-t border-slate-100 pt-4">
                          <p className="text-xs font-bold text-slate-700 mb-3">Aadhaar Card *</p>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div><label className={labelCls}>Aadhaar Number</label><input placeholder="1234 5678 9012" value={govIds.aadhaar.number} onChange={e=>setGovIds(p=>({...p,aadhaar:{...p.aadhaar,number:e.target.value}}))} className={`${inputCls} font-mono`} /></div>
                            <FileUpload label="Aadhaar Card Scan" category="aadhaar" onUploadComplete={(url) => setGovIds(p=>({...p,aadhaar:{...p.aadhaar,document_url:url}}))} />
                          </div>
                        </div>
                        {/* Passport (optional) */}
                        <div className="border-t border-slate-100 pt-4">
                          <p className="text-xs font-bold text-slate-700 mb-1">Passport <span className="text-slate-400 font-normal">(optional)</span></p>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div><label className={labelCls}>Passport Number</label><input placeholder="N1234567" value={govIds.passport.number} onChange={e=>setGovIds(p=>({...p,passport:{...p.passport,number:e.target.value.toUpperCase()}}))} className={`${inputCls} font-mono uppercase`} /></div>
                            <FileUpload label="Passport Scan" category="passport" onUploadComplete={(url) => setGovIds(p=>({...p,passport:{...p.passport,document_url:url}}))} />
                          </div>
                        </div>
                        {/* UAN — required for experienced */}
                        {!isFresher && (
                          <div className="border-t border-slate-100 pt-4">
                            <p className="text-xs font-bold text-slate-700 mb-1">UAN (Universal Account Number) *</p>
                            <p className="text-[10px] text-slate-400 mb-3">Required for experienced employees — your EPF account number from previous employer.</p>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div><label className={labelCls}>UAN Number</label><input placeholder="100123456789" value={govIds.uan.number} onChange={e=>setGovIds(p=>({...p,uan:{...p.uan,number:e.target.value}}))} className={`${inputCls} font-mono`} /></div>
                              <FileUpload label="UAN Passbook / Slip" category="other" onUploadComplete={(url) => setGovIds(p=>({...p,uan:{...p.uan,document_url:url}}))} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Education */}
                    {currentStep.key === "education" && (
                      <div className="space-y-4">
                        {education.map((edu, i) => (
                          <div key={i} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-600">Entry {i+1}</span>
                              {i > 0 && <button onClick={()=>setEducation(education.filter((_,j)=>j!==i))} className="text-[10px] text-red-500 hover:underline">Remove</button>}
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div><label className={labelCls}>Degree *</label><input placeholder="B.Tech" value={edu.degree} onChange={e=>{const n=[...education];n[i].degree=e.target.value;setEducation(n);}} className={inputCls} /></div>
                              <div><label className={labelCls}>Institution *</label><input placeholder="JNTU Hyderabad" value={edu.institution} onChange={e=>{const n=[...education];n[i].institution=e.target.value;setEducation(n);}} className={inputCls} /></div>
                              <div><label className={labelCls}>Field of Study</label><input placeholder="Computer Science" value={edu.field_of_study} onChange={e=>{const n=[...education];n[i].field_of_study=e.target.value;setEducation(n);}} className={inputCls} /></div>
                              <div><label className={labelCls}>Grade/CGPA</label><input placeholder="8.5 CGPA" value={edu.grade} onChange={e=>{const n=[...education];n[i].grade=e.target.value;setEducation(n);}} className={inputCls} /></div>
                              <div><label className={labelCls}>Start Year *</label><input type="number" placeholder="2013" value={edu.start_year} onChange={e=>{const n=[...education];n[i].start_year=e.target.value;setEducation(n);}} className={inputCls} /></div>
                              <div><label className={labelCls}>End Year *</label><input type="number" placeholder="2017" value={edu.end_year} onChange={e=>{const n=[...education];n[i].end_year=e.target.value;setEducation(n);}} className={inputCls} /></div>
                            </div>
                          </div>
                        ))}
                        <button onClick={()=>setEducation([...education,{degree:"",institution:"",field_of_study:"",start_year:"",end_year:"",grade:""}])}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 px-4 py-2.5 border border-brand-200 rounded-xl bg-brand-50 hover:bg-brand-100 transition-colors">
                          + Add Another Qualification
                        </button>
                      </div>
                    )}

                    {/* Experience */}
                    {currentStep.key === "experience" && (
                      <div className="space-y-4">
                        {isFresher ? (
                          <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center">
                            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-500">Not Applicable</p>
                            <p className="text-xs text-slate-400 mt-1">This section is skipped for freshers. No prior work experience required.</p>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">Add your previous employment details below.</p>
                            {experience.map((exp, i) => (
                              <div key={i} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-600">Company {i+1}</span>
                                  {i > 0 && <button onClick={()=>setExperience(experience.filter((_,j)=>j!==i))} className="text-[10px] text-red-500 hover:underline">Remove</button>}
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                  <div><label className={labelCls}>Company Name</label><input placeholder="TechCorp" value={exp.company} onChange={e=>{const n=[...experience];n[i].company=e.target.value;setExperience(n);}} className={inputCls} /></div>
                                  <div><label className={labelCls}>Designation</label><input placeholder="Developer" value={exp.designation} onChange={e=>{const n=[...experience];n[i].designation=e.target.value;setExperience(n);}} className={inputCls} /></div>
                                  <div><label className={labelCls}>Start Date</label><input type="date" value={exp.start_date} onChange={e=>{const n=[...experience];n[i].start_date=e.target.value;setExperience(n);}} className={inputCls} /></div>
                                  <div><label className={labelCls}>End Date</label><input type="date" value={exp.end_date} onChange={e=>{const n=[...experience];n[i].end_date=e.target.value;setExperience(n);}} className={inputCls} /></div>
                                </div>
                              </div>
                            ))}
                            <button onClick={()=>setExperience([...experience,{company:"",designation:"",start_date:"",end_date:"",is_current:false}])}
                              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 px-4 py-2.5 border border-brand-200 rounded-xl bg-brand-50 hover:bg-brand-100 transition-colors">
                              + Add Another Company
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Policy Acceptance */}
                    {currentStep.key === "policy_acceptance" && (
                      <div className="space-y-5">
                        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                          <p className="text-sm text-slate-700 leading-relaxed mb-4">
                            By accepting below, I acknowledge that I have read and agree to the following company policies:
                          </p>
                          <ul className="space-y-2 text-xs text-slate-600">
                            {["Employee Handbook & Code of Conduct","IT Security & Acceptable Use Policy","Data Privacy & Confidentiality Agreement","Leave & Attendance Policy","Anti-Harassment & Equal Opportunity Policy"].map((p,i) => (
                              <li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{p}</li>
                            ))}
                          </ul>
                        </div>
                        <label className="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${policyAccepted ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-brand-300'}">
                          <input type="checkbox" checked={policyAccepted} onChange={e=>setPolicyAccepted(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-500" />
                          <span className="text-sm font-bold text-slate-800">I accept all company policies</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="p-6 border-t border-slate-100 flex items-center justify-between">
                    {isOnboardingComplete ? (
                      <>
                        <div />
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span>Onboarding completed — <a href="/org/employee/profile" className="text-brand-600 font-bold hover:underline">go to Profile</a> to request edits</span>
                        </div>
                        <div />
                      </>
                    ) : (
                    <>
                    <button onClick={() => setActiveStep(Math.max(0, activeStep-1))} disabled={activeStep===0}
                      className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>

                    <span className="text-xs text-slate-400 hidden sm:block">Step {activeStep+1} of {visibleSteps.length}</span>

                    {currentStep.key === "policy_acceptance" ? (
                      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} disabled={saving || !policyAccepted}
                        onClick={() => handleSubmit("policy_acceptance", { accepted: true })}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 disabled:opacity-50 transition-all">
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {saving ? "Submitting..." : "Complete Onboarding"}
                      </motion.button>
                    ) : isStepDisabled(currentStep) ? (
                      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                        onClick={() => setActiveStep(activeStep + 1)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all">
                        Skip (Not Applicable) <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} disabled={saving}
                        onClick={() => {
                          // Validate required fields before submitting
                          const validation = validateSection(currentStep.key);
                          if (validation) { showToast(validation, "error"); return; }

                          const dataMap = {
                            personal_details: personal,
                            address: address,
                            emergency_contact: emergency,
                            bank_details: bank,
                            government_ids: govIds,
                            education: { entries: education.filter(e=>e.degree) },
                            experience: { entries: experience.filter(e=>e.company) },
                          };
                          handleSubmit(currentStep.key, dataMap[currentStep.key]);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70 transition-all">
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? "Saving..." : "Save & Continue"}
                      </motion.button>
                    )}
                    </>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
