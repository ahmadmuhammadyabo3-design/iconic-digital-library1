"use client";

import React, { useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";
import { Breadcrumbs } from "./breadcrumbs";

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellInner({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Pages that don't need persistent sidebar (full width landing, reader, login)
  const isFullWidthPage =
    !pathname ||
    pathname === "/" ||
    pathname.startsWith("/reader/") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 antialiased font-sans">
      <Header
        onToggleSidebar={!isFullWidthPage ? () => setIsSidebarOpen(!isSidebarOpen) : undefined}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex-1 flex">
        {!isFullWidthPage && (
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        )}

        <main
          className={`flex-1 transition-all flex flex-col ${
            !isFullWidthPage ? "lg:pl-64 min-h-[calc(100vh-4rem)]" : "w-full"
          }`}
        >
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {!isFullWidthPage && <Breadcrumbs />}
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950" />}>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}
