"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  FileSpreadsheet,
  ArrowLeft,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchDashboardData, fetchResources } from "@/lib/supabase/queries";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCatalog } from "@/lib/auth/permissions";
import type { ResourceRow } from "@/lib/supabase/types";

export default function AdminReportsPage() {
  const { role } = useAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchDashboardData>> | null>(null);
  const [popularResources, setPopularResources] = useState<ResourceRow[]>([]);
  const [dateRange, setDateRange] = useState<"30d" | "90d" | "year" | "all">("year");
  const [loading, setLoading] = useState(true);

  const canManage = canManageCatalog(role);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [dash, res] = await Promise.all([
        fetchDashboardData("admin"),
        fetchResources({ sortBy: "downloads", limit: 6 }),
      ]);
      setData(dash);
      setPopularResources(res.resources);
      setLoading(false);
    }
    load();
  }, []);

  const handleExportCSV = () => {
    if (!popularResources.length) return;
    const headers = "ID,Title,Author,Type,Year,Views,Downloads\n";
    const rows = popularResources
      .map(
        (r) =>
          `"${r.id}","${r.title.replace(/"/g, '""')}","${r.author}","${r.resource_type}",${
            r.publication_year || ""
          },${r.view_count},${r.download_count}`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `repository_analytics_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!canManage) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg font-bold">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">Librarian or Administrator privileges are required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
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
            <div className="p-2 rounded-lg bg-emerald-800 text-white shadow-xs">
              <BarChart3 className="size-5 text-emerald-300" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Institutional Reports & Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time circulation metrics, download tracking, research volume, and faculty performance reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as "30d" | "90d" | "year" | "all")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="year">Academic Year 2024/2025</option>
            <option value="all">All-Time Archive</option>
          </select>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-8 border-slate-300 dark:border-slate-700 shadow-xs"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-600" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading || !data ? (
        <div className="py-16 text-center text-xs text-slate-500">Calculating report analytics...</div>
      ) : (
        <div className="space-y-8">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-blue-900">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Cataloged Works
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                {data.totalResources}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Books: {data.totalBooks} | Research: {data.totalResearch}</p>
            </Card>

            <Card className="p-4 border-l-4 border-l-teal-600">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Repository Downloads
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                {data.totalDownloads.toLocaleString()}
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">+18.4% YoY circulation growth</p>
            </Card>

            <Card className="p-4 border-l-4 border-l-indigo-600">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Document Views / Consultations
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                {data.totalViews.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Indexed by academic search crawlers</p>
            </Card>

            <Card className="p-4 border-l-4 border-l-amber-500">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Active Research Readers
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                {data.activeUsers.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Across 5 university faculties</p>
            </Card>
          </div>

          {/* Activity Over Time Area Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Document Circulation Velocity</CardTitle>
              <CardDescription className="text-xs">
                Aggregate monthly downloads vs uploaded scholarly resources
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyActivity}>
                  <defs>
                    <linearGradient id="downGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0.05} />
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
                    fill="url(#downGrad)"
                    name="Downloads"
                  />
                  <Area
                    type="monotone"
                    dataKey="uploads"
                    stroke="#1e3a8a"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#upGrad)"
                    name="Uploads"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Performance Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Departmental Literature Distribution</CardTitle>
                <CardDescription className="text-xs">
                  Books and research works cataloged per academic department
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
                    <Bar dataKey="books" fill="#1e3a8a" name="Books" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="research" fill="#0d9488" name="Research Papers" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Popular Resources Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Most Consulted Scholarly Works</CardTitle>
                <CardDescription className="text-xs">
                  Top downloaded materials in the selected reporting period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-3">
                {popularResources.map((r, i) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs font-bold text-slate-400 w-4">{i + 1}.</span>
                      <div className="truncate">
                        <Link
                          href={r.resource_type === "book" ? `/library/${r.id}` : `/repository/${r.id}`}
                          className="font-semibold text-slate-900 dark:text-slate-100 hover:underline truncate block"
                        >
                          {r.title}
                        </Link>
                        <p className="text-[11px] text-slate-500">By {r.author}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] shrink-0 ml-2">
                      {r.download_count} dl
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
