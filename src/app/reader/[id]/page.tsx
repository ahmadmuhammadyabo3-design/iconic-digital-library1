"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfViewer } from "@/components/document/pdf-viewer";
import { fetchResourceById, recordView } from "@/lib/supabase/queries";
import { canViewResource } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/auth-context";
import type { ResourceRow } from "@/lib/supabase/types";

function ReaderContent() {
  const params = useParams();
  const router = useRouter();
  const { role, user } = useAuth();
  const id = params?.id as string;

  const [resource, setResource] = useState<ResourceRow | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="size-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Initializing secure reader environment...</p>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Document Unavailable</h2>
        <p className="text-xs text-slate-500 mt-1">This manuscript could not be found.</p>
        <Link href="/catalog" className="mt-4 inline-block">
          <Button variant="outline" size="sm" className="text-xs">
            Return to Catalogue
          </Button>
        </Link>
      </div>
    );
  }

  const isAuthorized = canViewResource(role, resource.access_level);

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
        <div className="size-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <BookOpen className="size-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Restricted Academic Resource</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          This document is classified under &ldquo;{resource.access_level.replace(/_/g, " ")}&rdquo; and requires elevated institutional privileges.
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <Link href="/login">
            <Button size="sm" className="bg-blue-900 text-white text-xs">
              Sign In with Authorized Account
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="text-xs">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in py-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-900 dark:text-slate-400 dark:hover:text-blue-300"
        >
          <ArrowLeft className="size-4" />
          Exit Reader
        </button>
      </div>

      <PdfViewer resource={resource} />
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
          <div className="size-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Initializing secure reader environment...</p>
        </div>
      }
    >
      <ReaderContent />
    </Suspense>
  );
}
