"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please provide your registered institutional email.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await resetPassword(email);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setMessage("A password recovery link has been dispatched to your email address.");
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-12 px-4 sm:px-6 animate-in fade-in">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-blue-900 text-white shadow-xl shadow-blue-900/20">
            <BookOpen className="size-6 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Recover Account Password
          </h1>
          <p className="text-xs text-slate-500">
            Enter your institutional email to receive a secure recovery link
          </p>
        </div>

        <Card className="border border-slate-200 shadow-xl dark:border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold">Password Assistance</CardTitle>
            <CardDescription className="text-xs">
              Follow instructions sent to your inbox to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                {message}
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
                    placeholder="user@iconic-library.edu"
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
                {loading ? "Sending link..." : "Send Password Reset Link"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          <Link href="/login" className="font-semibold text-blue-900 dark:text-blue-400 hover:underline flex items-center justify-center gap-1">
            <ArrowLeft className="size-3.5" />
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
