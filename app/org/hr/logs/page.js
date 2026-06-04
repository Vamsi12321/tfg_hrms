"use client";

import TopBar from "@/components/TopBar";

export default function OrgLogsPage() {
  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Organization Audit Logs" />
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Organization Audit Logs</h2>
          <p className="text-slate-500 mb-6">
            View detailed activity logs, security events, and configuration changes for your organization.
          </p>
          <div className="flex items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <p className="text-sm font-medium text-slate-400">Log entries will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
