"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResourceCard } from "@/components/resources/resource-card";
import { ResourceTable } from "@/components/resources/resource-table";
import { ResourceFormDialog } from "@/components/resources/resource-form-dialog";
import { fetchResources, fetchDepartments, deleteResource } from "@/lib/supabase/queries";
import { useAuth } from "@/lib/auth/auth-context";
import { canUploadResource, canManageCatalog } from "@/lib/auth/permissions";
import type { ResourceRow, DepartmentRow, ResourceType } from "@/lib/supabase/types";

export default function ResearchRepositoryPage() {
  const { role } = useAuth();
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [researchType, setResearchType] = useState<string>("all_research");
  const [departmentId, setDepartmentId] = useState("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "title" | "downloads">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceRow | null>(null);

  const canUpload = canUploadResource(role);
  const canManage = canManageCatalog(role);

  const loadData = async () => {
    setLoading(true);
    const [resResult, depts] = await Promise.all([
      fetchResources({
        type: (researchType === "all_research" ? "all_research" : researchType) as ResourceType | "all_research",
        departmentId: departmentId !== "all" ? departmentId : undefined,
        publicationYear: selectedYear !== "all" ? parseInt(selectedYear, 10) : undefined,
        search: search.trim() || undefined,
        sortBy,
        page: currentPage,
        limit: 12,
      }),
      fetchDepartments(),
    ]);

    setResources(resResult.resources);
    setTotalPages(resResult.totalPages);
    setTotalCount(resResult.totalCount);
    setDepartments(depts);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [researchType, departmentId, selectedYear, sortBy, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  const handleEdit = (resource: ResourceRow) => {
    setEditingResource(resource);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Archive this scholarly publication?")) {
      await deleteResource(id, true);
      loadData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-800 text-white shadow-xs">
              <GraduationCap className="size-5 text-teal-300" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Institutional Research Repository
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Permanent institutional archive of theses, dissertations, peer-reviewed articles, and research capstones
          </p>
        </div>

        {canUpload && (
          <Button
            onClick={() => {
              setEditingResource(null);
              setIsDialogOpen(true);
            }}
            className="bg-teal-700 hover:bg-teal-600 text-white text-xs gap-1.5 self-start sm:self-auto shadow-md"
          >
            <Plus className="size-4" />
            Submit Research
          </Button>
        )}
      </div>

      {/* Filter and View Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search theses, dissertations, supervisors, or authors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Research Type */}
          <select
            value={researchType}
            onChange={(e) => {
              setResearchType(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all_research">All Research Types</option>
            <option value="dissertation">Doctoral Dissertations</option>
            <option value="thesis">Master&apos;s Theses</option>
            <option value="project">Capstone Projects</option>
            <option value="journal_article">Journal Articles</option>
            <option value="conference_paper">Conference Papers</option>
            <option value="report">Technical Reports</option>
          </select>

          {/* Department */}
          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          {/* Publication Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Years</option>
            {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as "newest" | "title" | "downloads");
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="title">Sort: Title (A-Z)</option>
            <option value="downloads">Sort: Most Consulted</option>
          </select>

          {/* Grid / Table Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white shadow-xs text-teal-800 dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1 rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-white shadow-xs text-teal-800 dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Table View"
            >
              <TableIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="size-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Querying research archives...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-16 text-center dark:border-slate-800">
          <GraduationCap className="size-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No research publications found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting filters or keywords to discover other institutional papers.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setResearchType("all_research");
              setDepartmentId("all");
              setSelectedYear("all");
              setCurrentPage(1);
            }}
            className="mt-4 text-xs"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {resources.map((res) => (
                <ResourceCard key={res.id} resource={res} />
              ))}
            </div>
          ) : (
            <ResourceTable
              resources={resources}
              canManage={canManage}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              <p>
                Showing{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {(currentPage - 1) * 12 + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {Math.min(currentPage * 12, totalCount)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{totalCount}</span>{" "}
                publications
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="h-8 gap-1 text-xs"
                >
                  <ChevronLeft className="size-3.5" />
                  Previous
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`size-8 rounded-lg text-xs font-semibold transition-colors ${
                        p === currentPage
                          ? "bg-teal-700 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="h-8 gap-1 text-xs"
                >
                  Next
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Submit / Edit Research Dialog */}
      <ResourceFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        resourceToEdit={editingResource}
        defaultType="thesis"
        onSuccess={loadData}
      />
    </div>
  );
}
