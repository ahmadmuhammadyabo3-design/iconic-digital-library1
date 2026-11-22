"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { History, ArrowLeft, Search, ShieldCheck } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchAuditLogs } from "@/lib/supabase/queries";
import { useAuth } from "@/lib/auth/auth-context";
import type { AuditLogRow } from "@/lib/supabase/types";

export default function AdminAuditLogsPage() {
  const { role } = useAuth();
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const isAdmin = role === "admin";

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchAuditLogs(50);
      setLogs(data);
      setLoading(false);
    }
    load();
  }, []);

  if (!isAdmin) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg font-bold">Privilege Restriction</h2>
        <p className="text-xs text-slate-500 mt-1">Audit logs are exclusively viewable by System Administrators.</p>
      </div>
    );
  }

  const filtered = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.entity_type && log.entity_type.toLowerCase().includes(search.toLowerCase())) ||
      (log.ip_address && log.ip_address.includes(search));

    const matchesAction =
      actionFilter === "all" ||
      (actionFilter === "resource" && log.action.startsWith("RESOURCE_")) ||
      (actionFilter === "user" && log.action.includes("USER")) ||
      (actionFilter === "download" && log.action.includes("DOWNLOAD")) ||
      (actionFilter === "setting" && log.action.includes("SETTING"));

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-900 mb-2"
          >
            <ArrowLeft className="size-3.5" /> Back to Admin Overview
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-900 text-white shadow-xs">
              <History className="size-5 text-rose-300" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Security & System Audit Trail
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of user authentications, catalog modifications, role reassignments, and system updates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-emerald-600 text-emerald-700 dark:text-emerald-400 py-1 px-2.5">
            <ShieldCheck className="size-3.5 mr-1" />
            RLS Protected & Immutable
          </Badge>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit actions, IP addresses, or entity types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="all">All Audit Actions</option>
          <option value="resource">Resource Changes</option>
          <option value="user">User & Role Changes</option>
          <option value="download">Downloads</option>
          <option value="setting">System Settings</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading audit trail...</div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => {
                const isWarning =
                  log.action.includes("DELETED") ||
                  log.action.includes("ROLE") ||
                  log.action.includes("ARCHIVED");

                return (
                  <TableRow key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <TableCell className="text-xs text-slate-500 font-mono whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={isWarning ? "destructive" : "institutional"}
                        className="text-[10px] py-0 font-mono"
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 dark:text-slate-300 capitalize font-medium">
                      {log.entity_type || "system"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {log.ip_address || "127.0.0.1"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400 font-mono max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
