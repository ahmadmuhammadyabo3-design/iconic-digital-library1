"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Plus, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResourceTable } from "@/components/resources/resource-table";
import { ResourceFormDialog } from "@/components/resources/resource-form-dialog";
import { useToast } from "@/components/ui/toast";
import { fetchResources, deleteResource, updateResourceStatus } from "@/lib/supabase/queries";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCatalog } from "@/lib/auth/permissions";
import type { ResourceRow, ResourceType } from "@/lib/supabase/types";

export default function AdminResourcesPage() {
  const { role } = useAuth();
  const { success, error: toastError } = useToast();
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ResourceType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceRow | null>(null);

  const canManage = canManageCatalog(role);

  const loadData = async () => {
    setLoading(true);
    const res = await fetchResources({
      type: filterType,
      status: filterStatus !== "all" ? filterStatus : undefined,
      search: search.trim() || undefined,
      limit: 100,
    });
    setResources(res.resources);
    setTotalCount(res.totalCount);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleApprove = async (id: string) => {
    try {
      await updateResourceStatus(id, "published");
      success("Resource Approved & Published", "The manuscript is now visible in the active public catalogue.");
      loadData();
    } catch (err: unknown) {
      toastError("Approval Failed", (err as Error).message || "Could not update status.");
    }
  };

  const handleEdit = (resource: ResourceRow) => {
    setEditingResource(resource);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to archive this resource?")) {
      await deleteResource(id, true);
      success("Resource Archived", "Item has been successfully archived from circulation.");
      loadData();
    }
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
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-900 mb-2"
          >
            <ArrowLeft className="size-3.5" /> Back to Admin Overview
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-900 text-white shadow-xs">
              <BookOpen className="size-5 text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Resource Catalog Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Publish, edit bibliographic metadata, or archive books, dissertations, and research manuscripts
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingResource(null);
            setIsDialogOpen(true);
          }}
          className="bg-blue-900 hover:bg-blue-800 text-white text-xs gap-1.5 self-start sm:self-auto shadow-md"
        >
          <Plus className="size-4" />
          Add Resource
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="pending">Pending Review</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ResourceType | "all")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Types ({totalCount})</option>
            <option value="book">Books</option>
            <option value="dissertation">Dissertations</option>
            <option value="thesis">Theses</option>
            <option value="project">Capstone Projects</option>
            <option value="journal_article">Journal Articles</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading catalog items...</div>
      ) : (
        <ResourceTable
          resources={resources}
          canManage={canManage}
          onApprove={handleApprove}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Form Dialog */}
      <ResourceFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        resourceToEdit={editingResource}
        onSuccess={loadData}
      />
    </div>
  );
}
