"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="size-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Verifying institutional credentials...</p>
      </div>
    );
  }

  const isAuthorized = role === "admin" || role === "librarian";

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
        <div className="size-14 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="size-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Administrative Clearance Required
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            The requested console is restricted to university librarians and system administrators.
            Your current active role ({role}) does not hold management clearance.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-2">
          <Link href="/dashboard">
            <Button size="sm" variant="outline" className="text-xs gap-1.5">
              <ArrowLeft className="size-3.5" /> Return to Dashboard
            </Button>
          </Link>
          <Link href="/library">
            <Button size="sm" className="bg-blue-900 hover:bg-blue-800 text-white text-xs">
              Browse Catalogue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
