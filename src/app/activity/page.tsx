"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, BookOpen, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fetchUserReadingList } from "@/lib/supabase/queries";
import { useAuth } from "@/lib/auth/auth-context";
import type { ReadingListRow } from "@/lib/supabase/types";

export default function ActivityPage() {
  const { user } = useAuth();
  const [readingList, setReadingList] = useState<ReadingListRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const list = await fetchUserReadingList(user.id);
      setReadingList(list);
      setLoading(false);
    }
    load();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
        <div className="size-14 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center mx-auto">
          <Bookmark className="size-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Sign In to Track Reading Activity
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Personal reading lists, bookmarks, and study progress are private to registered scholars.
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
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentlyReading = readingList.filter((item) => item.status === "reading");
  const wantToRead = readingList.filter((item) => item.status === "want_to_read");

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500 text-white shadow-xs">
            <Bookmark className="size-5 fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            My Reading Activity & Bookmarks
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Keep track of your active readings, literature review bookmarks, and study progress
        </p>
      </div>

      <Tabs defaultValue="reading" className="w-full">
        <TabsList>
          <TabsTrigger value="reading">
            Currently Reading ({currentlyReading.length})
          </TabsTrigger>
          <TabsTrigger value="saved">
            Saved for Later ({wantToRead.length})
          </TabsTrigger>
        </TabsList>

        {/* Currently Reading Tab */}
        <TabsContent value="reading">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading study log...</div>
          ) : currentlyReading.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
              <BookOpen className="size-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No active reading logs
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Start reading a book or thesis to resume where you left off.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {currentlyReading.map((item) => (
                <Card key={item.id} className="p-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="institutional" className="text-[10px] py-0">
                        In Progress
                      </Badge>
                      <span className="text-[11px] font-mono text-slate-500">
                        Page {item.last_page_read}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                      {item.resource?.title || "Academic Publication"}
                    </h3>
                    <p className="text-xs text-teal-600 font-medium">
                      By {item.resource?.author || "Author"}
                    </p>

                    {item.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 italic">
                        &ldquo;{item.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="size-3" />
                      Updated {new Date(item.updated_at).toLocaleDateString()}
                    </span>
                    <Link href={`/reader/${item.resource_id}`}>
                      <Button size="xs" className="bg-blue-900 hover:bg-blue-800 text-white text-xs gap-1">
                        Resume Reading
                        <ArrowRight className="size-3" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Saved for Later Tab */}
        <TabsContent value="saved">
          {wantToRead.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
              <Bookmark className="size-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No bookmarked items
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Click the bookmark icon on any book or paper card to save it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {wantToRead.map((item) => (
                <Card key={item.id} className="p-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-[10px] py-0">
                      Reading List
                    </Badge>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                      {item.resource?.title || "Academic Publication"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      By {item.resource?.author || "Author"}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-slate-500 italic">&ldquo;{item.notes}&rdquo;</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                    <Link href={`/reader/${item.resource_id}`}>
                      <Button size="xs" variant="outline" className="text-xs">
                        Open in Reader
                      </Button>
                    </Link>
                    <Link href={`/library/${item.resource_id}`}>
                      <Button size="xs" className="bg-blue-900 text-white text-xs">
                        Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
