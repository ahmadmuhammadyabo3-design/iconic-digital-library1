"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  library: "Digital Library",
  repository: "Research Repository",
  search: "Unified Search",
  catalog: "Public Catalogue",
  activity: "Reading Activity",
  profile: "Scholar Profile",
  reader: "Document Reader",
  admin: "Administrative Console",
  resources: "Resource Catalogue",
  users: "User Management",
  categories: "Categories & Disciplines",
  departments: "Faculties & Departments",
  reports: "Reports & Analytics",
  "audit-logs": "Audit Trail",
  settings: "System Settings",
  login: "Sign In",
  register: "Register",
  "forgot-password": "Password Recovery",
  "reset-password": "Reset Password",
};

export function Breadcrumbs() {
  const pathname = usePathname();

  // Don't show on root landing page
  if (!pathname || pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-[11px] text-slate-500 py-2 overflow-x-auto whitespace-nowrap">
      <ol className="flex items-center gap-1.5">
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 text-slate-500 hover:text-blue-900 dark:hover:text-blue-400 transition-colors"
          >
            <Home className="size-3" />
            <span>Home</span>
          </Link>
        </li>

        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;
          const label = ROUTE_LABELS[segment] || (segment.length > 20 ? `${segment.slice(0, 18)}...` : segment);

          return (
            <li key={href} className="flex items-center gap-1.5">
              <ChevronRight className="size-3 text-slate-400" />
              {isLast ? (
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="hover:text-blue-900 dark:hover:text-blue-400 transition-colors capitalize"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
