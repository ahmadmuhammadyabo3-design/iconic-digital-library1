"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  X,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResourceCard } from "@/components/resources/resource-card";
import { ResourceTable } from "@/components/resources/resource-table";
import { fetchResources, fetchDepartments, fetchCategories } from "@/lib/supabase/queries";
import type { ResourceRow, DepartmentRow, CategoryRow, ResourceType, AccessLevel } from "@/lib/supabase/types";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialDepartment = searchParams.get("department") || "all";
  const initialType = (searchParams.get("type") || "all") as ResourceType | "all";

  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<ResourceType | "all">(initialType);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedDepartment, setSelectedDepartment] = useState(initialDepartment);
  const [selectedAccess, setSelectedAccess] = useState<AccessLevel | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "downloads" | "title">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Load departments & categories once
  useEffect(() => {
    async function loadMetadata() {
      const [depts, cats] = await Promise.all([fetchDepartments(), fetchCategories()]);
      setDepartments(depts);
      setCategories(cats);
    }
    loadMetadata();
  }, []);

  // Execute search whenever filters change
  useEffect(() => {
    async function performSearch() {
      setLoading(true);
      const res = await fetchResources({
        type: selectedType,
        categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
        departmentId: selectedDepartment !== "all" ? selectedDepartment : undefined,
        accessLevel: selectedAccess !== "all" ? selectedAccess : undefined,
        search: query.trim() || undefined,
        sortBy,
        limit: 36,
      });

      setResources(res.resources);
      setTotalCount(res.totalCount);
      setLoading(false);
    }

    performSearch();
  }, [query, selectedType, selectedCategory, selectedDepartment, selectedAccess, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.replace(`/search?q=${encodeURIComponent(query)}`);
  };

  const clearAllFilters = () => {
    setQuery("");
    setSelectedType("all");
    setSelectedCategory("all");
    setSelectedDepartment("all");
    setSelectedAccess("all");
    router.replace("/search");
  };

  const hasActiveFilters =
    query ||
    selectedType !== "all" ||
    selectedCategory !== "all" ||
    selectedDepartment !== "all" ||
    selectedAccess !== "all";

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Search Section */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-teal-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl space-y-4">
          <div>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-teal-300 border-teal-500/30 mb-2">
              Discovery Engine
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Unified Repository Search
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Search across books, doctoral dissertations, research papers, and technical reports
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-3.5 size-5 text-slate-400" />
            <input
              type="text"
              placeholder="Enter search keywords, author names, titles, topics, or ISBN..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl bg-white px-4 py-3 pl-11 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-inner"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Main Results Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Facet Filters Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <SlidersHorizontal className="size-3.5 text-blue-900" />
                Refine Results
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-medium"
                >
                  Reset all
                </button>
              )}
            </div>

            {/* Resource Type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Resource Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ResourceType | "all")}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">All Types</option>
                <option value="book">Academic Books</option>
                <option value="dissertation">Doctoral Dissertations</option>
                <option value="thesis">Master&apos;s Theses</option>
                <option value="project">Capstone Projects</option>
                <option value="journal_article">Journal Articles</option>
                <option value="conference_paper">Conference Papers</option>
                <option value="report">Technical Reports</option>
              </select>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Department / Faculty
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Academic Discipline
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">All Disciplines</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Access Level */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Access Level
              </label>
              <select
                value={selectedAccess}
                onChange={(e) => setSelectedAccess(e.target.value as AccessLevel | "all")}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">Any Access Level</option>
                <option value="public">Open Access (Public)</option>
                <option value="registered">Registered Members</option>
                <option value="staff_only">Staff & Faculty Only</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Results Area */}
        <main className="lg:col-span-3 space-y-4">
          {/* Status bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Found <strong className="text-slate-900 dark:text-slate-100">{totalCount}</strong>{" "}
              scholarly records
              {query && <span> for &ldquo;{query}&rdquo;</span>}
            </span>

            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "downloads" | "title")}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="newest">Sort: Newest</option>
                <option value="downloads">Sort: Most Downloaded</option>
                <option value="title">Sort: Title (A-Z)</option>
              </select>

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

          {/* Search Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
              <div className="size-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500">Searching repository collection...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-16 text-center dark:border-slate-800">
              <BookOpen className="size-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No matching works</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No items matched your combination of keywords and filters. Try broader keywords.
              </p>
              <Button onClick={clearAllFilters} variant="outline" size="sm" className="mt-4 text-xs">
                Clear All Filters
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {resources.map((res) => (
                <ResourceCard key={res.id} resource={res} />
              ))}
            </div>
          ) : (
            <ResourceTable resources={resources} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <div className="size-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Initializing search discovery...</p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
