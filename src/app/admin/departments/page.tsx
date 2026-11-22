"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Plus, ArrowLeft, Trash2, Edit } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { fetchDepartments } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCatalog } from "@/lib/auth/permissions";
import type { DepartmentRow } from "@/lib/supabase/types";

export default function AdminDepartmentsPage() {
  const { role } = useAuth();
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentRow | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [faculty, setFaculty] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const canManage = canManageCatalog(role);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchDepartments();
    setDepartments(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateDialog = () => {
    setEditingDepartment(null);
    setName("");
    setCode("");
    setFaculty("Faculty of Computing & Information Technology");
    setDescription("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (dept: DepartmentRow) => {
    setEditingDepartment(dept);
    setName(dept.name);
    setCode(dept.code);
    setFaculty(dept.faculty);
    setDescription(dept.description || "");
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !faculty.trim()) return;

    setSaving(true);
    try {
      if (editingDepartment) {
        await supabase
          .from("departments")
          .update({
            name: name.trim(),
            code: code.trim().toUpperCase(),
            faculty: faculty.trim(),
            description: description.trim() || null,
          } as never)
          .eq("id", editingDepartment.id);
      } else {
        await supabase.from("departments").insert({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          faculty: faculty.trim(),
          description: description.trim() || null,
        } as never);
      }
      await loadData();
      setIsDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this academic department?")) {
      await supabase.from("departments").delete().eq("id", id);
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
            <div className="p-2 rounded-lg bg-amber-500 text-white shadow-xs">
              <Building2 className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Faculties & Academic Departments
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure academic faculties and university research units for literature affiliation
          </p>
        </div>

        <Button
          onClick={openCreateDialog}
          className="bg-amber-600 hover:bg-amber-500 text-white text-xs gap-1.5 self-start sm:self-auto shadow-md"
        >
          <Plus className="size-4" />
          Add Department
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading departments...</div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Department Name</TableHead>
                <TableHead>Faculty Division</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {d.code}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    {d.name}
                  </TableCell>
                  <TableCell className="text-xs text-teal-700 dark:text-teal-400 font-medium">
                    {d.faculty}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-sm truncate">
                    {d.description || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => openEditDialog(d)}
                        title="Edit department"
                      >
                        <Edit className="size-3.5 text-blue-600" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => handleDelete(d.id)}
                        title="Delete department"
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

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? "Edit Department" : "Register Academic Department"}
            </DialogTitle>
            <DialogDescription>
              Assign code, full academic name, and parent faculty division.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Department Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Computer Science & Software Engineering"
                  required
                />
              </div>

              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Code *
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="CSSE"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Parent Faculty / School *
              </label>
              <Input
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                placeholder="e.g. Faculty of Computing & Information Technology"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Departmental Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of department's research focus..."
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
                className="bg-amber-600 hover:bg-amber-500 text-white"
              >
                {saving ? "Saving..." : editingDepartment ? "Update Department" : "Save Department"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
