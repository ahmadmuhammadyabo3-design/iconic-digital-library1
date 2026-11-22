"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  FileText,
  Shield,
  RotateCw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { getSignedDocumentUrl, recordDownload } from "@/lib/supabase/queries";
import { canDownloadResource, ACCESS_LEVEL_LABELS } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/auth-context";
import type { ResourceRow } from "@/lib/supabase/types";

interface PdfViewerProps {
  resource: ResourceRow;
}

export function PdfViewer({ resource }: PdfViewerProps) {
  const { role, user } = useAuth();
  const { success, error: toastError } = useToast();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showMetadata, setShowMetadata] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const totalPages = resource.page_count || 1;
  const isAuthorizedToDownload = canDownloadResource(role, resource.access_level);

  // Fetch signed URL for private or protected storage
  useEffect(() => {
    let active = true;
    async function loadUrl() {
      setLoading(true);
      if (resource.storage_path) {
        const { signedUrl: url } = await getSignedDocumentUrl(resource.storage_path);
        if (active) setSignedUrl(url || resource.file_url || null);
      } else {
        if (active) setSignedUrl(resource.file_url || null);
      }
      if (active) setLoading(false);
    }
    loadUrl();
    return () => {
      active = false;
    };
  }, [resource.storage_path, resource.file_url]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleDownload = async () => {
    if (!isAuthorizedToDownload) {
      toastError(
        "Download Restricted",
        "You are not authorized to download this document based on institutional access policies."
      );
      return;
    }
    setDownloading(true);
    try {
      success("Download Initiated", "Generating cryptographically signed document stream...");
      await recordDownload(resource.id, user?.id);
      let targetUrl = signedUrl;
      if (resource.storage_path) {
        const { signedUrl: freshUrl } = await getSignedDocumentUrl(resource.storage_path, 300);
        if (freshUrl) targetUrl = freshUrl;
      }
      if (targetUrl) {
        const a = document.createElement("a");
        a.href = targetUrl;
        a.download = `${resource.slug || "document"}.pdf`;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-900 text-slate-100 rounded-xl overflow-hidden shadow-2xl border border-slate-800 ${
        isFullscreen ? "h-screen w-screen rounded-none" : "h-[85vh] w-full"
      }`}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 gap-2">
        {/* Document Title & Badge */}
        <div className="flex items-center gap-2.5 truncate max-w-sm md:max-w-md">
          <FileText className="size-4 text-teal-400 shrink-0" />
          <span className="text-xs font-semibold truncate text-slate-200" title={resource.title}>
            {resource.title}
          </span>
          <Badge variant="outline" className="text-[10px] uppercase border-slate-700 text-slate-300">
            {ACCESS_LEVEL_LABELS[resource.access_level]}
          </Badge>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage <= 1}
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="font-mono text-xs px-1">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* View & Action Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleZoomOut}
            title="Zoom out"
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="text-[11px] font-mono text-slate-400 w-10 text-center">{zoomLevel}%</span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleZoomIn}
            title="Zoom in"
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleRotate}
            title="Rotate 90 degrees"
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <RotateCw className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setShowMetadata(!showMetadata)}
            title="Toggle Metadata panel"
            className={`text-slate-300 hover:text-white hover:bg-slate-800 ${
              showMetadata ? "bg-slate-800 text-teal-300" : ""
            }`}
          >
            <Info className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>

          {/* Download Action */}
          <Button
            size="xs"
            onClick={handleDownload}
            disabled={downloading || !isAuthorizedToDownload}
            className="bg-teal-600 hover:bg-teal-500 text-white text-xs gap-1 ml-2 disabled:opacity-50"
            title={
              isAuthorizedToDownload
                ? "Download protected PDF copy"
                : "Downloading restricted by institutional policy"
            }
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">
              {downloading ? "Downloading..." : isAuthorizedToDownload ? "Download" : "Restricted"}
            </span>
          </Button>
        </div>
      </div>

      {/* Main Reader Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Document Canvas Area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-900/90">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="size-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Preparing secure document viewer...</p>
            </div>
          ) : signedUrl ? (
            <div
              className="transition-transform duration-200 shadow-2xl bg-white w-full h-full rounded-md overflow-hidden flex flex-col"
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
              }}
            >
              <iframe
                src={`${signedUrl}#page=${currentPage}&toolbar=0&navpanes=0`}
                className="w-full h-full border-none"
                title={resource.title}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 max-w-md">
              <Shield className="size-10 text-amber-500 mb-3" />
              <h4 className="text-sm font-semibold text-slate-200">Document Protected or Unavailable</h4>
              <p className="text-xs text-slate-400 mt-1">
                This document requires verified institutional clearance or the PDF is currently being processed by the repository.
              </p>
            </div>
          )}
        </div>

        {/* Side Metadata Panel */}
        {showMetadata && (
          <aside className="w-72 bg-slate-950 border-l border-slate-800 p-4 overflow-y-auto text-xs space-y-4">
            <div>
              <h4 className="font-semibold text-slate-200 text-sm">{resource.title}</h4>
              <p className="text-teal-400 font-medium mt-0.5">{resource.author}</p>
            </div>

            <div className="space-y-2 border-t border-slate-800 pt-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Resource Type</span>
                <span className="text-slate-300 font-medium capitalize">
                  {resource.resource_type.replace(/_/g, " ")}
                </span>
              </div>

              {resource.supervisor && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Academic Supervisor</span>
                  <span className="text-slate-300">{resource.supervisor}</span>
                </div>
              )}

              {resource.department?.name && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Department</span>
                  <span className="text-slate-300">{resource.department.name}</span>
                </div>
              )}

              {resource.publication_year && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Publication Year</span>
                  <span className="text-slate-300">{resource.publication_year}</span>
                </div>
              )}

              {resource.isbn && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">ISBN / ISSN</span>
                  <span className="font-mono text-slate-300">{resource.isbn}</span>
                </div>
              )}

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Access Policy</span>
                <span className="text-slate-300">{ACCESS_LEVEL_LABELS[resource.access_level]}</span>
              </div>
            </div>

            {resource.abstract && (
              <div className="border-t border-slate-800 pt-3">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Abstract</span>
                <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-6">{resource.abstract}</p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
