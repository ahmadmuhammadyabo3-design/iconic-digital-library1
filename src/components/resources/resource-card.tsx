"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  GraduationCap,
  Eye,
  Download,
  Bookmark,
  Calendar,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ACCESS_LEVEL_LABELS, RESOURCE_TYPE_LABELS } from "@/lib/auth/permissions";
import { toggleBookmark } from "@/lib/supabase/queries";
import { useAuth } from "@/lib/auth/auth-context";
import type { ResourceRow } from "@/lib/supabase/types";

interface ResourceCardProps {
  resource: ResourceRow;
  onBookmarkChanged?: (isBookmarked: boolean) => void;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const isBook = resource.resource_type === "book";
  const detailLink = isBook ? `/library/${resource.id}` : `/repository/${resource.id}`;
  const readerLink = `/reader/${resource.id}`;

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("Please sign in to save items to your personal reading list.");
      return;
    }
    const result = await toggleBookmark(user.id, resource.id);
    setIsBookmarked(result.isBookmarked);
  };

  return (
    <Card className="group flex flex-col justify-between overflow-hidden border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div>
        {/* Cover / Header Banner */}
        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
          {resource.cover_image_url ? (
            <Image
              src={resource.cover_image_url}
              alt={resource.title}
              fill
              className="object-cover opacity-85 transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              {isBook ? (
                <BookOpen className="size-12 text-blue-300/40 mb-2" />
              ) : (
                <GraduationCap className="size-12 text-teal-300/40 mb-2" />
              )}
              <span className="text-[11px] font-semibold text-slate-300/80 uppercase tracking-widest line-clamp-1 px-4">
                {resource.publisher || resource.department?.name || "Academic Publication"}
              </span>
            </div>
          )}

          {/* Top badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
            <Badge
              variant={isBook ? "institutional" : "teal"}
              className="text-[10px] uppercase font-bold tracking-wider py-0"
            >
              {RESOURCE_TYPE_LABELS[resource.resource_type] || resource.resource_type}
            </Badge>
          </div>

          <div className="absolute top-2.5 right-2.5">
            <button
              onClick={handleBookmark}
              className={`flex size-7 items-center justify-center rounded-full backdrop-blur-md transition-colors ${
                isBookmarked
                  ? "bg-amber-500 text-white"
                  : "bg-black/40 text-white hover:bg-black/60"
              }`}
              title={isBookmarked ? "Remove bookmark" : "Add to reading list"}
            >
              <Bookmark className={`size-3.5 ${isBookmarked ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Access level pill at bottom of image */}
          <div className="absolute bottom-2 left-2.5">
            <Badge
              variant={resource.access_level === "public" ? "success" : "secondary"}
              className="text-[9px] py-0 bg-black/60 text-white border-none backdrop-blur-xs"
            >
              {ACCESS_LEVEL_LABELS[resource.access_level]}
            </Badge>
          </div>
        </div>

        {/* Content Details */}
        <CardContent className="p-4 pt-3.5">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1.5">
            {resource.publication_year && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {resource.publication_year}
              </span>
            )}
            {resource.department?.code && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <Building2 className="size-3" />
                  {resource.department.code}
                </span>
              </>
            )}
          </div>

          <Link href={detailLink} className="block group-hover:text-blue-700 transition-colors">
            <h3 className="font-semibold text-sm leading-snug text-slate-900 dark:text-slate-100 line-clamp-2">
              {resource.title}
            </h3>
          </Link>

          <p className="text-xs text-teal-700 dark:text-teal-400 font-medium mt-1 line-clamp-1">
            By {resource.author}
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {resource.description || resource.abstract || "Comprehensive scholarly work archived in the institutional digital repository."}
          </p>
        </CardContent>
      </div>

      {/* Footer stats and links */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1" title="Views">
            <Eye className="size-3 text-slate-400" />
            {resource.view_count || 0}
          </span>
          <span className="flex items-center gap-1" title="Downloads">
            <Download className="size-3 text-slate-400" />
            {resource.download_count || 0}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Link href={readerLink}>
            <Button size="xs" variant="outline" className="text-xs h-7 gap-1">
              <BookOpen className="size-3 text-teal-600" />
              Read
            </Button>
          </Link>
          <Link href={detailLink}>
            <Button size="xs" className="text-xs h-7 bg-blue-900 hover:bg-blue-800 text-white">
              Details
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
