"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, CheckCircle2, AlertCircle, FileText, X, Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/api";

export default function FileUpload({ category = "other", employeeId, onUploadComplete, label, accept = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" }) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB.");
      return;
    }

    setUploading(true);
    setError(null);

    const res = await uploadFile(file, category, employeeId);
    if (res.ok && res.data) {
      setUploaded({ url: res.data.url, name: file.name, size: file.size });
      if (onUploadComplete) onUploadComplete(res.data.url);
    } else {
      setError(res.data?.detail || res.data?.error || "Upload failed");
    }
    setUploading(false);
  };

  const clear = () => {
    setUploaded(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    if (onUploadComplete) onUploadComplete("");
  };

  return (
    <div className="w-full">
      {label && <p className="text-xs font-semibold text-slate-600 mb-1.5">{label}</p>}

      {!uploaded ? (
        <div className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer hover:border-brand-400 ${
          error ? "border-red-300 bg-red-50/50" : "border-slate-200 bg-slate-50/50"
        }`} onClick={() => inputRef.current?.click()}>
          <input ref={inputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
              <span className="text-xs text-slate-500">Uploading...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2">
              <Upload className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Click to upload <span className="text-slate-400">(PDF, JPG, PNG — max 10MB)</span></span>
            </div>
          )}
          {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-green-800 truncate">{uploaded.name}</p>
            <p className="text-[10px] text-green-600 truncate">{uploaded.url}</p>
          </div>
          <button onClick={clear} className="w-6 h-6 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center flex-shrink-0">
            <X className="w-3 h-3 text-green-700" />
          </button>
        </div>
      )}
    </div>
  );
}
