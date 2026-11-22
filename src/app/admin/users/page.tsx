"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Search, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { fetchProfiles, updateUserRole } from "@/lib/supabase/queries";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/auth-context";
import type { ProfileRow, UserRole } from "@/lib/supabase/types";

export default function AdminUsersPage() {
  const { role } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Role Edit Dialog State
  const [selectedUser, setSelectedUser] = useState<ProfileRow | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isAdmin = role === "admin";

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetchProfiles();
    setProfiles(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openRoleDialog = (userItem: ProfileRow) => {
    setSelectedUser(userItem);
    setSelectedRole(userItem.role);
    setStatusMessage(null);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setStatusMessage(null);

    const res = await updateUserRole(selectedUser.id, selectedRole);
    setSaving(false);

    if (res.success) {
      setStatusMessage({ type: "success", text: `Role updated to ${ROLE_LABELS[selectedRole]}` });
      setProfiles((prev) =>
        prev.map((p) => (p.id === selectedUser.id ? { ...p, role: selectedRole } : p))
      );
      setTimeout(() => setSelectedUser(null), 1200);
    } else {
      setStatusMessage({ type: "error", text: res.error || "Failed to update user role." });
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg font-bold">Administrator Privilege Required</h2>
        <p className="text-xs text-slate-500 mt-1">
          Only university administrators have clearance to manage accounts and user roles.
        </p>
      </div>
    );
  }

  const filtered = profiles.filter((p) => {
    const matchesSearch =
      !search ||
      (p.full_name && p.full_name.toLowerCase().includes(search.toLowerCase())) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.student_staff_id && p.student_staff_id.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === "all" || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
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
            <div className="p-2 rounded-lg bg-blue-900 text-white shadow-xs">
              <Users className="size-5 text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              User & Access Governance
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage institutional member profiles, role permissions, and system access rights
          </p>
        </div>

        <Badge variant="institutional" className="text-xs self-start sm:self-auto py-1 px-3">
          {profiles.length} Registered Members
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or matric ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="all">All Roles</option>
          <option value="admin">Administrators</option>
          <option value="librarian">Librarians</option>
          <option value="lecturer">Lecturers</option>
          <option value="student">Students</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading user records...</div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Profile</TableHead>
                <TableHead>Institutional ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {u.full_name ? u.full_name[0].toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-xs">
                          {u.full_name || "Academic Member"}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">
                    {u.student_staff_id || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                    {u.department?.code || "General"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        u.role === "admin"
                          ? "institutional"
                          : u.role === "librarian"
                          ? "teal"
                          : u.role === "lecturer"
                          ? "success"
                          : "secondary"
                      }
                      className="text-[10px] uppercase font-bold py-0"
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => openRoleDialog(u)}
                      className="text-xs h-7"
                    >
                      Change Role
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Role Assignment Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent onClose={() => setSelectedUser(null)}>
            <DialogHeader>
              <DialogTitle>Assign Institutional Role</DialogTitle>
              <DialogDescription>
                Modify permissions for {selectedUser.full_name} ({selectedUser.email}). Changes are protected and recorded in the audit trail.
              </DialogDescription>
            </DialogHeader>

            {statusMessage && (
              <div
                className={`rounded-lg p-3 text-xs mb-4 flex items-center gap-2 ${
                  statusMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <Check className="size-4 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 shrink-0" />
                )}
                {statusMessage.text}
              </div>
            )}

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Role Permission
                </label>
                <div className="space-y-2">
                  {(["student", "lecturer", "librarian", "admin"] as UserRole[]).map((r) => (
                    <label
                      key={r}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedRole === r
                          ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="user_role"
                        value={r}
                        checked={selectedRole === r}
                        onChange={() => setSelectedRole(r)}
                        className="mt-0.5 text-blue-900"
                      />
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 capitalize">
                          {ROLE_LABELS[r]}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {r === "admin"
                            ? "Full system oversight, role changes, and audit log access."
                            : r === "librarian"
                            ? "Manage catalog items, verify submissions, and oversee categories."
                            : r === "lecturer"
                            ? "Upload research papers, advise theses, and read staff materials."
                            : "Search catalog, read documents, and save reading list bookmarks."}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedUser(null)} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveRole}
                disabled={saving}
                className="bg-blue-900 hover:bg-blue-800 text-white"
              >
                {saving ? "Updating..." : "Save Role Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
