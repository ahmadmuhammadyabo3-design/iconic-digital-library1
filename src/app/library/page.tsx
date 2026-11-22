"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
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
import { fetchResources, fetchCategories, fetchDepartments, deleteResource } from "@/lib/supabase/queries";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCatalog, canUploadResource } from "@/lib/auth/permissions";
import type { ResourceRow, CategoryRow, DepartmentRow } from "@/lib/supabase/types";

export default function DigitalLibraryPage() {
  const { role } = useAuth();
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
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

  const canManage = canManageCatalog(role);
  const canUpload = canUploadResource(role, "book");

  const loadData = async () => {
    setLoading(true);
    const [resResult, cats, depts] = await Promise.all([
      fetchResources({
        type: "book",
        categoryId: categoryId !== "all" ? categoryId : undefined,
        departmentId: departmentId !== "all" ? departmentId : undefined,
        publicationYear: selectedYear !== "all" ? parseInt(selectedYear, 10) : undefined,
        search: search.trim() || undefined,
        sortBy,
        page: currentPage,
        limit: 12,
      }),
      fetchCategories("book"),
      fetchDepartments(),
    ]);

    setResources(resResult.resources);
    setTotalPages(resResult.totalPages);
    setTotalCount(resResult.totalCount);
    setCategories(cats);
    setDepartments(depts);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, departmentId, selectedYear, sortBy, currentPage]);

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
    if (confirm("Are you sure you want to archive this book? It will be removed from circulation.")) {
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
            <div className="p-2 rounded-lg bg-blue-900 text-white shadow-xs">
              <BookOpen className="size-5 text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Digital Academic Library
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Curated textbooks, monographs, and instructional volumes across academic faculties
          </p>
        </div>

        {canUpload && (
          <Button
            onClick={() => {
              setEditingResource(null);
              setIsDialogOpen(true);
            }}
            className="bg-blue-900 hover:bg-blue-800 text-white text-xs gap-1.5 self-start sm:self-auto shadow-md"
          >
            <Plus className="size-4" />
            Add New Book
          </Button>
        )}
      </div>

      {/* Filter and View Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search books by title, author, or ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </form>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Faculties</option>
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
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Years</option>
            {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as "newest" | "title" | "downloads");
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="newest">Sort: Newest</option>
            <option value="title">Sort: Title (A-Z)</option>
            <option value="downloads">Sort: Most Popular</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white shadow-xs text-blue-900 dark:bg-slate-700 dark:text-white"
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
                  ? "bg-white shadow-xs text-blue-900 dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Table View"
            >
              <TableIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="size-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Querying library catalogue...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-16 text-center dark:border-slate-800">
          <BookOpen className="size-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No books found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No textbooks match your active filter settings. Try clearing search keywords or selecting another category.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setCategoryId("all");
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
                books
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
                          ? "bg-blue-900 text-white shadow-xs"
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

      {/* Add / Edit Resource Form Modal */}
      <ResourceFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        resourceToEdit={editingResource}
        defaultType="book"
        onSuccess={loadData}
      />
    </div>
  );
}
