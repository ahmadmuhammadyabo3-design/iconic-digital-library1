"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Search,
  Bookmark,
  User,
  ShieldCheck,
  FolderTree,
  Building2,
  BarChart3,
  History,
  Settings,
  Users,
  Compass,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { role } = useAuth();

  const isLibrarianOrAdmin = role === "admin" || role === "librarian";
  const isAdmin = role === "admin";

  const mainNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Digital Library", href: "/library", icon: BookOpen },
    { name: "Research Repository", href: "/repository", icon: GraduationCap },
    { name: "Unified Search", href: "/search", icon: Search },
    { name: "Public Catalog", href: "/catalog", icon: Compass },
  ];

  const personalNav = [
    { name: "My Reading Activity", href: "/activity", icon: Bookmark },
    { name: "My Profile", href: "/profile", icon: User },
  ];

  const adminNav = [
    { name: "Admin Overview", href: "/admin", icon: ShieldCheck },
    { name: "Manage Resources", href: "/admin/resources", icon: BookOpen },
    { name: "Categories", href: "/admin/categories", icon: FolderTree },
    { name: "Departments", href: "/admin/departments", icon: Building2 },
    { name: "Reports & Analytics", href: "/admin/reports", icon: BarChart3 },
    ...(isAdmin
      ? [
          { name: "User Management", href: "/admin/users", icon: Users },
          { name: "Audit Logs", href: "/admin/audit-logs", icon: History },
          { name: "System Settings", href: "/admin/settings", icon: Settings },
        ]
      : []),
  ];

  const navClass = (href: string) => {
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
    return `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
      isActive
        ? "bg-blue-900 text-white shadow-xs font-semibold dark:bg-blue-800"
        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
    }`;
  };

  const content = (
    <div className="flex h-full flex-col justify-between py-4">
      <div className="space-y-6 px-3">
        {/* Main Section */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={navClass(item.href)}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Personal Section */}
        {role !== "guest" && (
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Personal Space
            </div>
            <nav className="space-y-1">
              {personalNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={navClass(item.href)}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Administration Section */}
        {isLibrarianOrAdmin && (
          <div>
            <div className="flex items-center justify-between px-3 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Administration
              </span>
              <Badge variant="outline" className="text-[9px] px-1 py-0">
                Staff
              </Badge>
            </div>
            <nav className="space-y-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={navClass(item.href)}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer System Status Badge */}
      <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Repository Active</span>
          </div>
          <span className="text-[10px] text-slate-400">v1.0-prod</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 top-16 left-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 z-30 overflow-y-auto">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-y-auto pt-4">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
