"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  LogOut,
  LogIn,
  Menu,
  X,
  Bell,
  Check,
  CheckCheck,
  ShieldCheck,
  User,
  Bookmark,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/supabase/queries";
import type { NotificationRow } from "@/lib/supabase/types";

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ onToggleSidebar, isSidebarOpen }: HeaderProps) {
  const { user, profile, role, signOut } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Notification state
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadNotifications() {
      if (user?.id) {
        const notifs = await fetchUserNotifications(user.id);
        setNotifications(notifs);
      } else {
        const notifs = await fetchUserNotifications();
        setNotifications(notifs);
      }
    }
    loadNotifications();
  }, [user?.id]);

  // Click outside listeners
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    if (user?.id) {
      await markAllNotificationsAsRead(user.id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="lg:hidden text-slate-700 dark:text-slate-200"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          )}

          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-900 text-white shadow-md shadow-blue-900/20">
              <BookOpen className="size-5 text-teal-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-blue-950 dark:text-white leading-tight">
                ICONIC <span className="text-teal-600 dark:text-teal-400 font-semibold text-xs tracking-wider uppercase ml-1">Library</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                Digital Repository System
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search input */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search books, theses, dissertations, papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-all"
            />
          </form>
        </div>

        {/* Right: Role Badge, Notifications & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Institutional Role Status Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <span className="text-[11px] text-slate-400 font-medium">Status:</span>
            <Badge
              variant={
                role === "admin"
                  ? "institutional"
                  : role === "librarian"
                  ? "teal"
                  : role === "lecturer"
                  ? "success"
                  : role === "student"
                  ? "secondary"
                  : "outline"
              }
              className="text-[10px] px-2 py-0 uppercase tracking-wider font-semibold"
            >
              {ROLE_LABELS[role]}
            </Badge>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              aria-label="View notifications"
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-teal-600" />
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-teal-100 px-1.5 py-0.2 text-[10px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-medium text-blue-900 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="size-3" />
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 py-1">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications at this time
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (notif.link) {
                            router.push(notif.link);
                            setIsNotifOpen(false);
                          }
                        }}
                        className={`p-2.5 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                          !notif.is_read
                            ? "bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/30 opacity-75"
                        }`}
                      >
                        <div className="size-2 rounded-full bg-teal-500 mt-1.5 shrink-0" style={{ opacity: notif.is_read ? 0 : 1 }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        {!notif.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            title="Mark as read"
                            className="text-slate-400 hover:text-teal-600 p-1"
                          >
                            <Check className="size-3" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Account / Navigation */}
          {role !== "guest" ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-200 p-1 pr-2.5 text-xs hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-blue-900 text-white font-semibold text-[11px]">
                  {profile?.full_name ? profile.full_name[0].toUpperCase() : "U"}
                </div>
                <span className="hidden lg:inline-block font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                  {profile?.full_name || user?.email || "Account"}
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {profile?.full_name || "Academic Member"}
                    </p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-mono truncate">
                      {profile?.email}
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <User className="size-3.5 text-blue-900 dark:text-blue-400" />
                    <span>Scholar Profile</span>
                  </Link>

                  <Link
                    href="/activity"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Bookmark className="size-3.5 text-teal-600" />
                    <span>Reading Activity</span>
                  </Link>

                  {(role === "admin" || role === "librarian") && (
                    <Link
                      href="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <ShieldCheck className="size-3.5 text-amber-500" />
                      <span>Admin Console</span>
                    </Link>
                  )}

                  <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    >
                      <LogOut className="size-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-xs">
                  <LogIn className="size-3.5 mr-1" />
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-blue-900 text-white hover:bg-blue-800 text-xs">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
