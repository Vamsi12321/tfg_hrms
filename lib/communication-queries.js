"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listEmailTemplates, listCampaigns, listEmailLogs,
  getCommStats, getEmailSettings
} from "@/lib/communication-api";

// ── Templates ─────────────────────────────────────────────────────────────
export function useEmailTemplates(params = {}) {
  return useQuery({
    queryKey: ["email-templates", params],
    queryFn: async () => {
      const res = await listEmailTemplates(params);
      return res.ok ? (res.data?.templates || res.data || []) : [];
    },
    staleTime: 30000, // 30s — templates don't change often
  });
}

// ── Campaigns ─────────────────────────────────────────────────────────────
export function useCampaigns(params = {}) {
  return useQuery({
    queryKey: ["campaigns", params],
    queryFn: async () => {
      const res = await listCampaigns(params);
      return res.ok ? { campaigns: res.data?.campaigns || res.data || [], total: res.data?.total || 0 } : { campaigns: [], total: 0 };
    },
    staleTime: 10000, // 10s
  });
}

// ── Email Logs ────────────────────────────────────────────────────────────
export function useEmailLogs(params = {}) {
  return useQuery({
    queryKey: ["email-logs", params],
    queryFn: async () => {
      const res = await listEmailLogs(params);
      return res.ok ? { logs: res.data?.logs || res.data || [], total: res.data?.total || 0, pages: res.data?.pages || 1 } : { logs: [], total: 0, pages: 1 };
    },
    staleTime: 10000,
  });
}

// ── Stats ─────────────────────────────────────────────────────────────────
export function useCommStats() {
  return useQuery({
    queryKey: ["comm-stats"],
    queryFn: async () => {
      const res = await getCommStats();
      return res.ok ? res.data : null;
    },
    staleTime: 30000,
  });
}

// ── Settings ──────────────────────────────────────────────────────────────
export function useEmailSettings() {
  return useQuery({
    queryKey: ["email-settings"],
    queryFn: async () => {
      const res = await getEmailSettings();
      return res.ok ? res.data : null;
    },
    staleTime: 60000, // 1 minute — settings rarely change
  });
}

// ── Invalidate helper ─────────────────────────────────────────────────────
export function useCommInvalidate() {
  const queryClient = useQueryClient();
  return (key) => queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
}
