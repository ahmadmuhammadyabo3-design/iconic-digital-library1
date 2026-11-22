"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, KeyRound, Check, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { supabase } from "@/lib/supabase/client";
import { uploadProfileAvatar } from "@/lib/supabase/queries";

export default function ProfilePage() {
  const { user, profile, role, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [studentStaffId, setStudentStaffId] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
      setStudentStaffId(profile.student_staff_id || "");
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);

    try {
      if (user) {
        await supabase
          .from("profiles")
          .update({
            full_name: fullName,
            phone: phone || null,
            bio: bio || null,
            student_staff_id: studentStaffId || null,
          } as never)
          .eq("id", user.id);
        await refreshProfile();
      }
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setSavingPassword(true);
    setPasswordError(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const { error } = await uploadProfileAvatar(file, user.id);
      if (error) {
        toastError("Upload Failed", error);
      } else {
        success("Avatar Updated", "Your institutional profile image has been uploaded successfully.");
        await refreshProfile();
      }
    } catch (err: unknown) {
      toastError("Upload Error", (err as Error).message || "An unexpected error occurred.");
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
        <div className="size-14 rounded-full bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300 flex items-center justify-center mx-auto">
          <User className="size-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Authentication Required
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Please log in with your institutional credentials to manage your scholar profile.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-2">
          <Link href="/login">
            <Button size="sm" className="bg-blue-900 hover:bg-blue-800 text-white text-xs">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" variant="outline" className="text-xs">
              Register Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-4xl pb-12">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Institutional Scholar Profile
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal academic identity, credentials, and institutional affiliation
          </p>
        </div>

        <Badge variant="institutional" className="text-xs self-start sm:self-auto uppercase tracking-wider py-1 px-3">
          {ROLE_LABELS[role]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card Overview */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
              <div className="relative group">
                <div className="relative size-20 rounded-full overflow-hidden bg-blue-900 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-blue-900/20 border-2 border-slate-200 dark:border-slate-700">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.full_name || "Profile Avatar"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    profile?.full_name ? profile.full_name[0].toUpperCase() : "U"
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
                      <Loader2 className="size-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white shadow-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  title="Upload new avatar image"
                >
                  <Camera className="size-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {profile?.full_name || "Academic Member"}
                </h3>
                <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                  {profile?.email}
                </p>
              </div>

              <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-left text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Role Status</span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {role}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">ID / Matric</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {profile?.student_staff_id || "IDL-8021"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Department</span>
                  <span className="text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                    {profile?.department?.name || "Computing & IT"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Edit Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="size-4 text-blue-900" />
                Personal Details
              </CardTitle>
              <CardDescription className="text-xs">
                Update your name, contact phone, and biographical statement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profileSuccess && (
                <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 mb-4 flex items-center gap-1.5">
                  <Check className="size-4" /> Profile details saved successfully!
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Legal / Academic Name
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Alistair Sterling"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Institutional ID
                    </label>
                    <Input
                      value={studentStaffId}
                      onChange={(e) => setStudentStaffId(e.target.value)}
                      placeholder="e.g. STU-2024-001"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Contact Phone
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+44 20 7946 0192"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Academic Biography & Research Interests
                  </label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief description of your research areas or academic background..."
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-blue-900 hover:bg-blue-800 text-white text-xs"
                >
                  {savingProfile ? "Saving..." : "Save Profile Details"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <KeyRound className="size-4 text-amber-500" />
                Security Credentials
              </CardTitle>
              <CardDescription className="text-xs">
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordError && (
                <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 mb-4">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 mb-4 flex items-center gap-1.5">
                  <Check className="size-4" /> Password updated successfully!
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      New Password
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={savingPassword}
                  variant="outline"
                  className="text-xs"
                >
                  {savingPassword ? "Updating..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
