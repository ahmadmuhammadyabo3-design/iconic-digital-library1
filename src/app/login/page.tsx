"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import type { UserRole } from "@/lib/supabase/types";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, switchDemoRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide your institutional email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await signIn(email, password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.push("/dashboard");
    }
  };

  const handleQuickLogin = (role: UserRole, demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    switchDemoRole(role);
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center py-12 px-4 sm:px-6 animate-in fade-in">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-blue-900 text-white shadow-xl shadow-blue-900/20">
            <BookOpen className="size-6 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Institutional Sign In
          </h1>
          <p className="text-xs text-slate-500">
            Access your university library account, research repository, and digital archives
          </p>
        </div>

        <Card className="border border-slate-200 shadow-xl dark:border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold">Sign In to Your Account</CardTitle>
            <CardDescription className="text-xs">
              Enter your credentials to access protected materials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@iconic-library.edu"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-medium text-blue-900 dark:text-blue-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs py-2.5 h-auto shadow-md"
              >
                {loading ? "Verifying..." : "Sign In to Repository"}
              </Button>
            </form>

            {/* Quick Demo Switcher for Evaluation */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold flex items-center gap-1">
                  <Sparkles className="size-3 text-amber-500" />
                  Evaluation Quick Login:
                </span>
                <span className="text-[10px]">Instant Role Switch</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => handleQuickLogin("admin", "admin@iconic-library.edu")}
                  className="text-[11px] justify-start font-medium"
                >
                  <ShieldCheck className="size-3 text-blue-900 mr-1" />
                  Administrator
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => handleQuickLogin("librarian", "librarian@iconic-library.edu")}
                  className="text-[11px] justify-start font-medium"
                >
                  <BookOpen className="size-3 text-teal-600 mr-1" />
                  Librarian
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => handleQuickLogin("lecturer", "lecturer@iconic-library.edu")}
                  className="text-[11px] justify-start font-medium"
                >
                  <Sparkles className="size-3 text-emerald-600 mr-1" />
                  Lecturer / Scholar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => handleQuickLogin("student", "student@iconic-library.edu")}
                  className="text-[11px] justify-start font-medium"
                >
                  <ArrowRight className="size-3 text-slate-500 mr-1" />
                  Student Member
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Need an institutional account?{" "}
          <Link href="/register" className="font-bold text-blue-900 dark:text-blue-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
