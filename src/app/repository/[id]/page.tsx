"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  GraduationCap,
  ArrowLeft,
  Download,
  Bookmark,
  Calendar,
  Building2,
  Quote,
  Eye,
  Check,
  UserCheck,
  FileText,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { fetchResourceById, toggleBookmark, recordView, recordDownload, getSignedDocumentUrl } from "@/lib/supabase/queries";
import { canDownloadResource, ACCESS_LEVEL_LABELS, RESOURCE_TYPE_LABELS } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/auth-context";
import type { ResourceRow } from "@/lib/supabase/types";

function ResearchDetailsContent() {
  const params = useParams();
  const { role, user } = useAuth();
  const { success, error: toastError } = useToast();
  const id = params?.id as string;

  const [resource, setResource] = useState<ResourceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      const res = await fetchResourceById(id);
      setResource(res);
      setLoading(false);
      if (res) {
        recordView(res.id, user?.id);
      }
    }
    load();
  }, [id, user?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="size-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Loading research publication...</p>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Publication Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">This repository item may have been moved or archived.</p>
        <Link href="/repository" className="mt-4 inline-block">
          <Button variant="outline" size="sm" className="text-xs">
            Return to Repository
          </Button>
        </Link>
      </div>
    );
  }

  const isPermittedToDownload = canDownloadResource(role, resource.access_level);

  const handleBookmarkToggle = async () => {
    if (!user) {
      toastError("Authentication Required", "Please sign in to save publications to your reading list.");
      return;
    }
    const res = await toggleBookmark(user.id, resource.id);
    setIsBookmarked(res.isBookmarked);
    success(
      res.isBookmarked ? "Saved to Reading List" : "Removed from Reading List",
      `"${resource.title}" has been updated in your bookmarks.`
    );
  };

  const copyCitation = (format: "apa" | "ieee") => {
    let citation = "";
    if (format === "apa") {
      citation = `${resource.author} (${resource.publication_year || "n.d."}). ${resource.title} [${
        RESOURCE_TYPE_LABELS[resource.resource_type]
      }]. ${resource.department?.name || "ICONIC University"}.`;
    } else {
      citation = `[1] ${resource.author}, "${resource.title}," ${RESOURCE_TYPE_LABELS[resource.resource_type]}, ${
        resource.department?.name || "ICONIC University"
      }, ${resource.publication_year || ""}.`;
    }
    navigator.clipboard.writeText(citation);
    setCopiedCitation(format);
    success("Citation Copied", `Formatted in ${format.toUpperCase()} academic standard.`);
    setTimeout(() => setCopiedCitation(null), 3000);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      success("Share Link Copied", "Direct repository URL has been copied to your clipboard.");
    }
  };

  const handleDownload = async () => {
    if (!isPermittedToDownload) {
      toastError("Access Restricted", "Downloading is restricted according to institutional access policies.");
      return;
    }
    success("Download Starting", "Preparing cryptographically signed document link...");
    recordDownload(resource.id, user?.id);
    const { signedUrl } = await getSignedDocumentUrl(resource.storage_path || "");
    const target = signedUrl || resource.file_url;
    if (target) {
      window.open(target, "_blank");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      <div>
        <Link
          href="/repository"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300"
        >
          <ArrowLeft className="size-4" />
          Back to Research Repository
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-4">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-950 via-slate-900 to-blue-950 text-white shadow-xl border border-slate-800 flex flex-col items-center text-center">
            <div className="size-16 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center mb-4">
              <GraduationCap className="size-8" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
              {RESOURCE_TYPE_LABELS[resource.resource_type]}
            </span>
            <span className="text-xs text-slate-300 mt-1 font-mono">
              Ref: {resource.slug}
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <Link href={`/reader/${resource.id}`} className="block">
              <Button className="w-full bg-teal-600 hover:bg-teal-500 text-white gap-2 text-xs py-2.5 h-auto shadow-md">
                <FileText className="size-4" />
                Read Document in Viewer
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!isPermittedToDownload}
              className="w-full gap-2 text-xs py-2.5 h-auto border-slate-300 dark:border-slate-700"
            >
              <Download className="size-4" />
              {isPermittedToDownload ? "Download PDF Manuscript" : "Download Restricted"}
            </Button>

            <Button
              variant="ghost"
              onClick={handleBookmarkToggle}
              className={`w-full gap-2 text-xs py-2 h-auto ${
                isBookmarked ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-slate-600"
              }`}
            >
              <Bookmark className={`size-4 ${isBookmarked ? "fill-current" : ""}`} />
              {isBookmarked ? "Saved in Reading List" : "Bookmark for Research"}
            </Button>

            <Button
              variant="ghost"
              onClick={handleShare}
              className="w-full gap-2 text-xs py-2 h-auto text-slate-600 hover:text-teal-700 dark:hover:text-teal-300"
            >
              <Share2 className="size-4" />
              Share Repository Link
            </Button>
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-3 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="teal" className="text-xs">
                {RESOURCE_TYPE_LABELS[resource.resource_type]}
              </Badge>
              <Badge
                variant={resource.access_level === "public" ? "success" : "secondary"}
                className="text-xs"
              >
                {ACCESS_LEVEL_LABELS[resource.access_level]}
              </Badge>
              {resource.department?.code && (
                <Badge variant="outline" className="text-xs">
                  {resource.department.code}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 leading-snug">
              {resource.title}
            </h1>

            <p className="text-base text-teal-700 dark:text-teal-400 font-medium mt-1.5">
              Candidate / Author: <span className="font-bold">{resource.author}</span>
            </p>

            {resource.supervisor && (
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <UserCheck className="size-3.5 text-blue-900 dark:text-blue-400" />
                Supervised by: <span className="font-semibold">{resource.supervisor}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6 py-3 border-y border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            {resource.publication_year && (
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="size-4 text-slate-400" />
                Submitted {resource.publication_year}
              </span>
            )}
            {resource.department?.name && (
              <span className="flex items-center gap-1.5 font-medium">
                <Building2 className="size-4 text-slate-400" />
                {resource.department.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Eye className="size-4 text-slate-400" />
              {resource.view_count} Citations / Consultations
            </span>
            <span className="flex items-center gap-1.5">
              <Download className="size-4 text-slate-400" />
              {resource.download_count} Downloads
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Abstract
            </h2>
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                {resource.abstract || resource.description || "The full scholarly abstract for this repository item is archived with the permanent institutional manuscript."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Faculty
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {resource.department?.faculty || "Faculty of Computing & IT"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Manuscript Extent
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {resource.page_count ? `${resource.page_count} Pages` : "Full Manuscript"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Permanent URI
              </span>
              <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                hdl.handle.net/iconic/{resource.id.slice(0, 8)}
              </span>
            </div>
          </div>

          <Card className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <Quote className="size-4 text-teal-600" />
                  Academic Citation Generator
                </span>
                <span className="text-[11px] text-slate-400">Copy to Clipboard</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => copyCitation("apa")}
                  className="text-xs h-7"
                >
                  {copiedCitation === "apa" ? <Check className="size-3 text-emerald-600 mr-1" /> : null}
                  APA 7th Edition
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => copyCitation("ieee")}
                  className="text-xs h-7"
                >
                  {copiedCitation === "ieee" ? <Check className="size-3 text-emerald-600 mr-1" /> : null}
                  IEEE Standard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ResearchDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <div className="size-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Loading research publication...</p>
        </div>
      }
    >
      <ResearchDetailsContent />
    </Suspense>
  );
}
