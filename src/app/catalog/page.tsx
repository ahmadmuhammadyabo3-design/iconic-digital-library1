"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResourceCard } from "@/components/resources/resource-card";
import { fetchResources, fetchCategories } from "@/lib/supabase/queries";
import type { ResourceRow, CategoryRow } from "@/lib/supabase/types";

export default function PublicCatalogPage() {
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "book" | "research">("all");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [res, cats] = await Promise.all([
        fetchResources({
          type: filterType === "research" ? "all_research" : filterType,
          categoryId: selectedCat !== "all" ? selectedCat : undefined,
          accessLevel: "public",
          search: search.trim() || undefined,
          limit: 30,
        }),
        fetchCategories(),
      ]);
      setResources(res.resources);
      setCategories(cats);
      setLoading(false);
    }
    load();
  }, [filterType, selectedCat, search]);

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950 to-slate-900 p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Badge variant="institutional" className="text-[10px] bg-blue-800 text-teal-300 mb-2">
            OPEN ACCESS CATALOG
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Public Academic Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Browse freely accessible publications, dissertations, and academic books preserved for global scholarly exchange.
          </p>
        </div>

        <Link href="/login">
          <Button className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs">
            Sign In for Full Repository
          </Button>
        </Link>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant={filterType === "all" ? "default" : "outline"}
            onClick={() => setFilterType("all")}
            className="text-xs h-7"
          >
            All Public Items
          </Button>
          <Button
            size="xs"
            variant={filterType === "book" ? "default" : "outline"}
            onClick={() => setFilterType("book")}
            className="text-xs h-7 gap-1"
          >
            <BookOpen className="size-3" />
            Books
          </Button>
          <Button
            size="xs"
            variant={filterType === "research" ? "default" : "outline"}
            onClick={() => setFilterType("research")}
            className="text-xs h-7 gap-1"
          >
            <GraduationCap className="size-3" />
            Research
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          {categories.length > 0 && (
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="all">All Disciplines</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter public records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 py-1 text-xs text-slate-900 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="size-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Retrieving open-access collection...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {resources.map((item) => (
            <ResourceCard key={item.id} resource={item} />
          ))}
        </div>
      )}
    </div>
  );
}
