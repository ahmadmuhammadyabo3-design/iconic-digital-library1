"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Users,
  Download,
  Eye,
  TrendingUp,
  Clock,
  ShieldCheck,
  Plus,
  ArrowUpRight,
  Bookmark,
  FileCheck2,
  FolderTree,
  Building2,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import { fetchDashboardData, fetchAuditLogs, fetchUserReadingList, fetchResources } from "@/lib/supabase/queries";
import { ResourceCard } from "@/components/resources/resource-card";
import { ResourceFormDialog } from "@/components/resources/resource-form-dialog";
import type { AuditLogRow, ReadingListRow, ResourceRow } from "@/lib/supabase/types";

export function DashboardView() {
  const { role, profile, user } = useAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchDashboardData>> | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [readingList, setReadingList] = useState<ReadingListRow[]>([]);
  const [myPublications, setMyPublications] = useState<ResourceRow[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [dash, logs, rList, allRes] = await Promise.all([
        fetchDashboardData(role),
        fetchAuditLogs(6),
        fetchUserReadingList(user?.id),
        fetchResources({ limit: 50 }),
      ]);
      setData(dash);
      setAuditLogs(logs);
      setReadingList(rList);

      // Extract lecturer's own publications
      if (role === "lecturer") {
        const authored = allRes.resources.filter(
          (r) =>
            r.created_by === profile?.id ||
            r.author.toLowerCase().includes(profile?.full_name?.toLowerCase() || "")
        );
        setMyPublications(authored.length > 0 ? authored : allRes.resources.slice(0, 2));
      }

      // Extract pending submissions for librarian review
      if (role === "librarian" || role === "admin") {
        const pending = allRes.resources.filter((r) => r.status === "pending");
        setPendingSubmissions(pending);
      }

      setLoading(false);
    }
    load();
  }, [role, user?.id, profile?.id, profile?.full_name]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="size-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Loading institutional dashboard...</p>
      </div>
    );
  }

  const isAdmin = role === "admin";
  const isLibrarian = role === "librarian";
  const isLecturer = role === "lecturer";
  const isStudent = role === "student";
  const isStaff = isAdmin || isLibrarian || isLecturer;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-teal-950 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="institutional" className="bg-blue-800/80 text-teal-300 text-xs px-2.5">
              {role.toUpperCase()} CONSOLE
            </Badge>
            <span className="text-xs text-slate-300">Academic Year 2024/2025</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {profile?.full_name || "Scholar"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
            {isAdmin
              ? "Comprehensive institutional oversight, user management, archival audit trails, and repository metrics."
              : isLibrarian
              ? "Manage catalogue indexing, verify submitted theses and dissertations, and oversee repository circulation."
              : isLecturer
              ? "Submit verified research papers, track manuscript citations, and manage departmental publications."
              : "Access verified academic textbooks, peer-reviewed articles, doctoral dissertations, and institutional research."}
          </p>
        </div>

        {isStaff && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs gap-1.5 shadow-md shadow-teal-500/20"
            >
              <Plus className="size-4" />
              {isLecturer ? "Submit Research" : "Upload Resource"}
            </Button>
            {isAdmin && (
              <Link href="/admin/reports">
                <Button variant="outline" className="border-slate-700 bg-slate-900/60 text-white hover:bg-slate-800 text-xs gap-1.5">
                  <TrendingUp className="size-4" />
                  Analytics
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 border-l-4 border-l-blue-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isAdmin ? "Total Catalog" : "Academic Books"}
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
              <BookOpen className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-2">
            {isAdmin ? data.totalResources : data.totalBooks}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="size-3" />
            +12% this semester
          </p>
        </Card>

        <Card className="p-4 sm:p-5 border-l-4 border-l-teal-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Research Works
            </span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <GraduationCap className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-2">
            {data.totalResearch}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Theses, dissertations & capstones</p>
        </Card>

        <Card className="p-4 sm:p-5 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Downloads
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Download className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-2">
            {data.totalDownloads.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="size-3" />
            Active document circulation
          </p>
        </Card>

        <Card className="p-4 sm:p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isAdmin ? "Registered Users" : isLecturer ? "My Citations / Views" : "Document Views"}
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              {isAdmin ? <Users className="size-4" /> : <Eye className="size-4" />}
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-2">
            {isAdmin ? data.totalUsers.toLocaleString() : isLecturer ? "842" : data.totalViews.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isAdmin ? `${data.activeUsers} active this week` : "Across university departments"}
          </p>
        </Card>
      </div>

      {/* LIBRARIAN ONLY: Pending Verifications & Quick Actions */}
      {isLibrarian && (
        <Card className="border-teal-200 dark:border-teal-900 bg-teal-50/40 dark:bg-teal-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <FileCheck2 className="size-5 text-teal-600" />
                  Catalogue & Submission Verification
                </CardTitle>
                <CardDescription className="text-xs">
                  Review submitted postgraduate dissertations, faculty research papers, and catalogue indexing
                </CardDescription>
              </div>
              <Link href="/admin/resources">
                <Button size="xs" variant="outline" className="text-xs">
                  Review Submissions ({pendingSubmissions.length})
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-teal-100 dark:border-teal-900/60">
              <Link href="/admin/resources">
                <Button size="xs" className="bg-blue-900 hover:bg-blue-800 text-white text-xs gap-1.5">
                  <BookOpen className="size-3.5" />
                  Manage Full Catalogue
                </Button>
              </Link>
              <Link href="/admin/categories">
                <Button size="xs" variant="outline" className="text-xs gap-1.5">
                  <FolderTree className="size-3.5" />
                  Subject Disciplines
                </Button>
              </Link>
              <Link href="/admin/departments">
                <Button size="xs" variant="outline" className="text-xs gap-1.5">
                  <Building2 className="size-3.5" />
                  Faculty Departments
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LECTURER / RESEARCHER: My Uploaded Publications */}
      {isLecturer && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <GraduationCap className="size-5 text-blue-900 dark:text-blue-400" />
                  My Authored Research Publications
                </CardTitle>
                <CardDescription className="text-xs">
                  Publications, theses supervised, and journal pre-prints submitted by your account
                </CardDescription>
              </div>
              <Button
                size="xs"
                onClick={() => setIsFormOpen(true)}
                className="bg-blue-900 hover:bg-blue-800 text-white text-xs gap-1"
              >
                <Plus className="size-3.5" />
                Submit New Work
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {myPublications.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-xl">
                <p className="text-xs text-slate-500">You have not submitted any research papers yet.</p>
                <Button
                  size="xs"
                  onClick={() => setIsFormOpen(true)}
                  className="mt-3 bg-teal-600 text-white text-xs"
                >
                  Upload Your First Paper
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myPublications.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={item.status === "published" ? "success" : "secondary"}
                          className="text-[10px] uppercase py-0"
                        >
                          {item.status || "published"}
                        </Badge>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.resource_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Published {item.publication_year || 2024} • {item.download_count} Downloads • {item.view_count} Views
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <Link href={`/reader/${item.id}`}>
                        <Button size="xs" variant="outline" className="text-xs">
                          Open Reader
                        </Button>
                      </Link>
                      <Link href={`/repository/${item.id}`}>
                        <Button size="xs" className="bg-blue-900 text-white text-xs">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STUDENT ONLY: Reading Progress / Resume Reading */}
      {isStudent && readingList.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Bookmark className="size-4 text-blue-900 dark:text-blue-400" />
                Resume Academic Reading
              </CardTitle>
              <Link href="/activity">
                <Button size="xs" variant="ghost" className="text-xs text-blue-900 dark:text-blue-400 hover:underline">
                  View Reading List ({readingList.length}) &rarr;
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {readingList.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.resource?.title || "Academic Publication"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Last read page {item.last_page_read}
                    </p>
                  </div>
                  <Link href={`/reader/${item.resource_id}`} className="shrink-0">
                    <Button size="xs" className="bg-blue-900 text-white text-xs gap-1">
                      Resume
                      <ArrowRight className="size-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Charts Section (For Staff: Admin, Librarian, Lecturer) */}
      {isStaff && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Trend Area Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Circulation & Repository Activity</CardTitle>
                  <CardDescription className="text-xs">
                    Monthly distribution of uploads and document downloads
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  Last 6 Months
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="h-64 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyActivity}>
                  <defs>
                    <linearGradient id="downloadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "8px",
                      fontSize: "12px",
                      border: "none",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="downloads"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#downloadGrad)"
                    name="Downloads"
                  />
                  <Area
                    type="monotone"
                    dataKey="uploads"
                    stroke="#1e3a8a"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#uploadGrad)"
                    name="Uploads"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Resource Distribution Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Collection Breakdown</CardTitle>
              <CardDescription className="text-xs">
                Categorised by academic resource types
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={data.resourceDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {data.resourceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "8px",
                      fontSize: "12px",
                      border: "none",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 w-full text-[10px] text-slate-500">
                {data.resourceDistribution.slice(0, 4).map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 truncate">
                    <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Featured / Recommended Resources Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {role === "student" ? "Recommended For Your Studies" : "Recent Institutional Additions"}
            </h2>
            <p className="text-xs text-slate-500">
              Scholarly publications and literature verified by repository curators
            </p>
          </div>
          <Link href="/catalog" className="text-xs font-semibold text-blue-900 dark:text-blue-400 hover:underline flex items-center gap-1">
            Browse Full Catalog &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.recentResources.slice(0, 3).map((res) => (
            <ResourceCard key={res.id} resource={res} />
          ))}
        </div>
      </div>

      {/* Admin Audit Logs & Faculty Breakdown (Admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Breakdown Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Faculty & Department Circulation</CardTitle>
              <CardDescription className="text-xs">
                Downloads and resources indexed by academic faculties
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.departmentBreakdown}>
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "8px",
                      fontSize: "12px",
                      border: "none",
                    }}
                  />
                  <Bar dataKey="downloads" fill="#1e3a8a" name="Downloads" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="research" fill="#0d9488" name="Research Papers" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Real-time Audit Log Preview */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-amber-500" />
                  Audit Trail
                </CardTitle>
                <Link href="/admin/audit-logs">
                  <Button variant="ghost" size="xs" className="text-[11px]">
                    View All
                  </Button>
                </Link>
              </div>
              <CardDescription className="text-xs">Recent security and catalog actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0 text-xs">
                  <Clock className="size-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {log.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {new Date(log.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} • IP: {log.ip_address || "Internal"}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add / Submit Resource Modal */}
      <ResourceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        defaultType={isLecturer ? "journal_article" : "book"}
        onSuccess={async () => {
          const fresh = await fetchDashboardData(role);
          setData(fresh);
        }}
      />
    </div>
  );
}
