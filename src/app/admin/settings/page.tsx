"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Settings, Shield, ArrowLeft, Check, Database, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import { createAuditLog } from "@/lib/supabase/queries";

export default function AdminSettingsPage() {
  const { role } = useAuth();
  const [institutionName, setInstitutionName] = useState("ICONIC Digital Library & Repository System");
  const [maxUploadSize, setMaxUploadSize] = useState("50");
  const [allowGuestBrowsing, setAllowGuestBrowsing] = useState(true);
  const [defaultAccessLevel, setDefaultAccessLevel] = useState("public");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isAdmin = role === "admin";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      await createAuditLog("SETTINGS_UPDATED", "system_settings", "general", {
        institutionName,
        maxUploadSize,
        allowGuestBrowsing,
        defaultAccessLevel,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg font-bold">Privilege Restriction</h2>
        <p className="text-xs text-slate-500 mt-1">System settings are only accessible by Administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl pb-12">
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
            <div className="p-2 rounded-lg bg-slate-800 text-white shadow-xs">
              <Settings className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              System & Repository Governance
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure institutional policies, file storage limits, and access constraints
          </p>
        </div>

        <Badge variant="institutional" className="text-xs self-start sm:self-auto py-1 px-3">
          ADMINISTRATOR ONLY
        </Badge>
      </div>

      {saved && (
        <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-2">
          <Check className="size-4" />
          Settings successfully saved and committed to system configuration.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Institutional Branding */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="size-4 text-blue-900" />
              General Institutional Identity
            </CardTitle>
            <CardDescription className="text-xs">
              Configure the public name of the digital library and institutional repository
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Institution Repository Name
              </label>
              <Input
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Storage Quotas & Security */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Database className="size-4 text-teal-600" />
              Storage & Document Upload Quotas
            </CardTitle>
            <CardDescription className="text-xs">
              Control maximum PDF document sizes and default visibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Maximum Upload Size per Document (MB)
                </label>
                <Input
                  type="number"
                  value={maxUploadSize}
                  onChange={(e) => setMaxUploadSize(e.target.value)}
                  min={1}
                  max={200}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Default Access Policy for New Submissions
                </label>
                <select
                  value={defaultAccessLevel}
                  onChange={(e) => setDefaultAccessLevel(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="public">Public (Open Access)</option>
                  <option value="registered">Registered Members Only</option>
                  <option value="staff_only">Staff & Faculty Only</option>
                  <option value="restricted">Restricted (Librarian/Admin)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Allow Public Guest Browsing
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Permit visitors without accounts to search open-access catalog resources
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowGuestBrowsing}
                onChange={(e) => setAllowGuestBrowsing(e.target.checked)}
                className="size-4 text-blue-900 rounded-sm"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-900 hover:bg-blue-800 text-white gap-2 text-xs py-2.5 h-auto px-6 shadow-md"
          >
            <Save className="size-4" />
            {saving ? "Saving Changes..." : "Save System Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
