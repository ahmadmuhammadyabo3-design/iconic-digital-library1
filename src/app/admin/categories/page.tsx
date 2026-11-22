"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FolderTree, Plus, ArrowLeft, Trash2, Edit } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { fetchCategories } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCatalog } from "@/lib/auth/permissions";
import type { CategoryRow } from "@/lib/supabase/types";

export default function AdminCategoriesPage() {
  const { role } = useAuth();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categoryType, setCategoryType] = useState<"book" | "research" | "both">("both");
  const [saving, setSaving] = useState(false);

  const canManage = canManageCatalog(role);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchCategories();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setCategoryType("both");
    setIsDialogOpen(true);
  };

  const openEditDialog = (cat: CategoryRow) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setCategoryType(cat.category_type);
    setIsDialogOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (editingCategory) {
        await supabase
          .from("categories")
          .update({
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim() || null,
            category_type: categoryType,
          } as never)
          .eq("id", editingCategory.id);
      } else {
        await supabase.from("categories").insert({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          category_type: categoryType,
        } as never);
      }
      await loadData();
      setIsDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this subject category? Associated resources may lose their classification.")) {
      await supabase.from("categories").delete().eq("id", id);
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
            <div className="p-2 rounded-lg bg-teal-800 text-white shadow-xs">
              <FolderTree className="size-5 text-teal-300" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Categories & Subject Disciplines
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organize the repository knowledge tree across books, dissertations, and research fields
          </p>
        </div>

        <Button
          onClick={openCreateDialog}
          className="bg-teal-700 hover:bg-teal-600 text-white text-xs gap-1.5 self-start sm:self-auto shadow-md"
        >
          <Plus className="size-4" />
          Add Category
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading categories...</div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Slug Identifier</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    {c.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{c.slug}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {c.category_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-sm truncate">
                    {c.description || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => openEditDialog(c)}
                        title="Edit category"
                      >
                        <Edit className="size-3.5 text-blue-600" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => handleDelete(c.id)}
                        title="Delete category"
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Category Modal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
            <DialogDescription>
              Define discipline taxonomy for cataloging books and research papers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category Title *
              </label>
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Artificial Intelligence & Robotics"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Slug URL
                </label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="ai-robotics"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Applicable Scope
                </label>
                <select
                  value={categoryType}
                  onChange={(e) =>
                    setCategoryType(e.target.value as "book" | "research" | "both")
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="both">Both Books & Research</option>
                  <option value="book">Books Only</option>
                  <option value="research">Research Repository Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Scope Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of subjects included under this classification..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-teal-700 hover:bg-teal-600 text-white"
              >
                {saving ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
