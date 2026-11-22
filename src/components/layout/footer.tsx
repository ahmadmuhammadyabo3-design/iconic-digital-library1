import React from "react";
import Link from "next/link";
import { BookOpen, Shield, Award } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-blue-900 text-white">
              <BookOpen className="size-4 text-teal-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                ICONIC Digital Library and Repository System
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Institutional Knowledge Repository & Open Access Archive
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 dark:text-slate-400">
            <Link href="/catalog" className="hover:text-blue-900 dark:hover:text-blue-400">
              Public Catalog
            </Link>
            <Link href="/search" className="hover:text-blue-900 dark:hover:text-blue-400">
              Advanced Search
            </Link>
            <span className="flex items-center gap-1 text-[11px]">
              <Shield className="size-3 text-teal-600" />
              Role-Based Access
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <Award className="size-3 text-amber-500" />
              Institutional Repository
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            &copy; 2026 ICONIC Institutional Repository. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
