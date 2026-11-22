"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  BookOpen,
  FolderTree,
  Building2,
  BarChart3,
  History,
  Settings,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { fetchDashboardData, fetchAuditLogs } from "@/lib/supabase/queries";
import type { AuditLogRow } from "@/lib/supabase/types";

export default function AdminOverviewPage() {
  const { role } = useAuth();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchDashboardData>> | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === "admin";
  const isLibrarian = role === "librarian";

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [s, logs] = await Promise.all([fetchDashboardData(role), fetchAuditLogs(5)]);
      setStats(s);
      setRecentLogs(logs);
      setLoading(false);
    }
    load();
  }, [role]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="size-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Loading administrative console...</p>
      </div>
    );
  }

  if (!isAdmin && !isLibrarian) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
        <div className="size-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="size-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Staff Privileges Required</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The administrative control panel is restricted to verified university librarians and system administrators.
        </p>
        <Link href="/dashboard" className="inline-block pt-2">
          <Button variant="outline" size="sm" className="text-xs">
            Return to User Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const adminSections = [
    {
      title: "Resource Management",
      description: "Curate books, theses, dissertations, and research manuscripts",
      href: "/admin/resources",
      icon: BookOpen,
      color: "bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-300",
      badge: `${stats?.totalResources || 444} Items`,
    },
    ...(isAdmin
      ? [
          {
            title: "User Management",
            description: "Manage accounts, assign roles, and audit researcher access",
            href: "/admin/users",
            icon: Users,
            color: "bg-purple-50 text-purple-900 dark:bg-purple-950 dark:text-purple-300",
            badge: "Admin Only",
          },
        ]
      : []),
    {
      title: "Categories & Disciplines",
      description: "Configure Dewey/LC classifications and subject topics",
      href: "/admin/categories",
      icon: FolderTree,
      color: "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
      badge: "Indexing",
    },
    {
      title: "Faculties & Departments",
      description: "Manage university academic units and research divisions",
      href: "/admin/departments",
      icon: Building2,
      color: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
      badge: "Academic",
    },
    {
      title: "Reports & Analytics",
      description: "Institutional repository KPIs, circulation charts, and date filters",
      href: "/admin/reports",
      icon: BarChart3,
      color: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
      badge: "Reports",
    },
    ...(isAdmin
      ? [
          {
            title: "Security Audit Logs",
            description: "Tamper-evident system activity and permission change trail",
            href: "/admin/audit-logs",
            icon: History,
            color: "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
            badge: "Security",
          },
          {
            title: "System Settings",
            description: "Storage quotas, MIME types, and repository access policies",
            href: "/admin/settings",
            icon: Settings,
            color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
            badge: "System",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-900 text-white shadow-xs">
              <ShieldCheck className="size-5 text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Institutional Administration
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized administrative console for library cataloguing, user access, and repository governance
          </p>
        </div>

        <Badge variant="institutional" className="text-xs self-start sm:self-auto py-1 px-3">
          {role.toUpperCase()} LEVEL CLEARANCE
        </Badge>
      </div>

      {/* Grid of Administration Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((sec) => {
          const Icon = sec.icon;
          return (
            <Link key={sec.href} href={sec.href} className="group">
              <Card className="h-full border border-slate-200 hover:border-blue-400 dark:border-slate-800 hover:shadow-lg transition-all p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`size-10 rounded-xl flex items-center justify-center ${sec.color}`}>
                      <Icon className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {sec.badge}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">
                    {sec.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {sec.description}
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-blue-900 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                  Access Module <ArrowRight className="size-3.5" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Security Logs Preview */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <History className="size-4 text-blue-900" />
                Recent System Activity & Audit Trail
              </CardTitle>
              <Link href="/admin/audit-logs">
                <Button variant="ghost" size="xs" className="text-xs">
                  View Full Audit Log &rarr;
                </Button>
              </Link>
            </div>
            <CardDescription className="text-xs">
              Live tamper-evident operational events recorded by the security logging system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {log.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-slate-400 text-[11px] ml-2">
                    {log.entity_type ? `[${log.entity_type}]` : ""}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] flex items-center gap-3">
                  <span>IP: {log.ip_address || "Internal"}</span>
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
