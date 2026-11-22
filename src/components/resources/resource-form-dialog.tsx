"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  createResource,
  updateResource,
  fetchDepartments,
  fetchCategories,
  uploadResourceFile,
  uploadCoverImage,
} from "@/lib/supabase/queries";
import type {
  ResourceRow,
  ResourceType,
  AccessLevel,
  ResourceStatus,
  DepartmentRow,
  CategoryRow,
} from "@/lib/supabase/types";
import { UploadCloud, FileText, Image as ImageIcon, CheckCircle, AlertCircle, X } from "lucide-react";

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceToEdit?: ResourceRow | null;
  defaultType?: ResourceType;
  onSuccess?: () => void;
}

export function ResourceFormDialog({
  open,
  onOpenChange,
  resourceToEdit,
  defaultType = "book",
  onSuccess,
}: ResourceFormDialogProps) {
  const { success, error: toastError } = useToast();
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coAuthors, setCoAuthors] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>(defaultType);
  const [departmentId, setDepartmentId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("public");
  const [status, setStatus] = useState<ResourceStatus>("published");
  const [publicationYear, setPublicationYear] = useState<number>(2025);
  const [publisher, setPublisher] = useState("");
  const [edition, setEdition] = useState("");
  const [isbn, setIsbn] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [description, setDescription] = useState("");
  const [abstract, setAbstract] = useState("");
  const [pageCount, setPageCount] = useState<number>(100);
  const [keywords, setKeywords] = useState("");

  // Files
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [existingStoragePath, setExistingStoragePath] = useState<string | null>(null);

  useEffect(() => {
    async function loadSelectData() {
      const [depts, cats] = await Promise.all([fetchDepartments(), fetchCategories()]);
      setDepartments(depts);
      setCategories(cats);
      if (depts.length > 0 && !departmentId) setDepartmentId(depts[0].id);
      if (cats.length > 0 && !categoryId) setCategoryId(cats[0].id);
    }
    loadSelectData();
  }, [departmentId, categoryId]);

  useEffect(() => {
    if (resourceToEdit) {
      setTitle(resourceToEdit.title);
      setAuthor(resourceToEdit.author);
      setCoAuthors(resourceToEdit.co_authors?.join(", ") || "");
      setResourceType(resourceToEdit.resource_type);
      setDepartmentId(resourceToEdit.department_id || "");
      setCategoryId(resourceToEdit.category_id || "");
      setAccessLevel(resourceToEdit.access_level);
      setStatus(resourceToEdit.status || "published");
      setPublicationYear(resourceToEdit.publication_year || 2025);
      setPublisher(resourceToEdit.publisher || "");
      setEdition(resourceToEdit.edition || "");
      setIsbn(resourceToEdit.isbn || "");
      setSupervisor(resourceToEdit.supervisor || "");
      setDescription(resourceToEdit.description || "");
      setAbstract(resourceToEdit.abstract || "");
      setPageCount(resourceToEdit.page_count || 1);
      setCoverPreviewUrl(resourceToEdit.cover_image_url || null);
      setExistingStoragePath(resourceToEdit.storage_path || null);
    } else {
      setTitle("");
      setAuthor("");
      setCoAuthors("");
      setResourceType(defaultType);
      setAccessLevel("public");
      setStatus("published");
      setPublicationYear(2025);
      setPublisher("");
      setEdition("");
      setIsbn("");
      setSupervisor("");
      setDescription("");
      setAbstract("");
      setPageCount(100);
      setKeywords("");
      setPdfFile(null);
      setCoverFile(null);
      setCoverPreviewUrl(null);
      setExistingStoragePath(null);
    }
    setError(null);
  }, [resourceToEdit, defaultType]);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        setError("Please select a valid PDF document.");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setError("Document file exceeds 100MB limit.");
        return;
      }
      setPdfFile(file);
      setError(null);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file (JPG, PNG, WebP).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Cover image exceeds 5MB limit.");
        return;
      }
      setCoverFile(file);
      setCoverPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      setError("Please provide at least a title and primary author.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalStoragePath = existingStoragePath;
      let finalFileSize = resourceToEdit?.file_size_bytes || 0;
      let finalCoverUrl = coverPreviewUrl;

      // 1. Upload PDF if a new file was chosen
      if (pdfFile) {
        setUploadProgress("Uploading manuscript to secure repository storage...");
        const uploadRes = await uploadResourceFile(pdfFile);
        if (uploadRes.error) {
          setError(uploadRes.error);
          setLoading(false);
          setUploadProgress(null);
          return;
        }
        finalStoragePath = uploadRes.storagePath;
        finalFileSize = uploadRes.fileSize;
      }

      // 2. Upload Cover if a new cover image was chosen
      if (coverFile) {
        setUploadProgress("Uploading book cover image...");
        const coverRes = await uploadCoverImage(coverFile);
        if (coverRes.error) {
          setError(coverRes.error);
          setLoading(false);
          setUploadProgress(null);
          return;
        }
        finalCoverUrl = coverRes.publicUrl;
      }

      setUploadProgress("Saving bibliographic record to database...");

      const payload: Partial<ResourceRow> = {
        title: title.trim(),
        author: author.trim(),
        co_authors: coAuthors
          ? coAuthors.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        resource_type: resourceType,
        department_id: departmentId || null,
        category_id: categoryId || null,
        access_level: accessLevel,
        status,
        publication_year: Number(publicationYear) || null,
        publisher: publisher.trim() || null,
        edition: edition.trim() || null,
        isbn: isbn.trim() || null,
        supervisor: supervisor.trim() || null,
        description: description.trim() || null,
        abstract: abstract.trim() || null,
        page_count: Number(pageCount) || null,
        storage_path: finalStoragePath || "documents/sample.pdf",
        file_size_bytes: finalFileSize || 2500000,
        cover_image_url: finalCoverUrl || null,
      };

      if (resourceToEdit) {
        const res = await updateResource(resourceToEdit.id, payload);
        if (!res.success) {
          setError(res.error || "Failed to update resource");
          toastError("Update failed", res.error || "Could not update resource");
          setLoading(false);
          setUploadProgress(null);
          return;
        }
        success("Resource updated", `"${title}" has been updated successfully.`);
      } else {
        const res = await createResource(payload);
        if (res.error) {
          setError(res.error);
          toastError("Creation failed", res.error);
          setLoading(false);
          setUploadProgress(null);
          return;
        }
        success(
          status === "published" ? "Resource published" : "Submission received",
          `"${title}" has been successfully added to the catalog.`
        );
      }

      setLoading(false);
      setUploadProgress(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message);
      toastError("Error", (err as Error).message);
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const isBook = resourceType === "book";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {resourceToEdit ? "Edit Resource Metadata" : "Add Academic Resource"}
          </DialogTitle>
          <DialogDescription>
            Submit verified bibliographic, archival, and document files for permanent institutional discovery.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300 mb-4 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {uploadProgress && (
          <div className="rounded-xl bg-teal-50 border border-teal-200 p-3.5 text-xs text-teal-800 dark:bg-teal-950/50 dark:border-teal-900 dark:text-teal-300 mb-4 flex items-center gap-2">
            <div className="size-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin shrink-0" />
            <span>{uploadProgress}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Resource Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Consensus in Cloud-Native Databases"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Academic Resource Type
              </label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value as ResourceType)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="book">Academic Book</option>
                <option value="thesis">Master&apos;s Thesis</option>
                <option value="dissertation">Doctoral Dissertation</option>
                <option value="project">Undergraduate Capstone Project</option>
                <option value="journal_article">Peer-Reviewed Journal Article</option>
                <option value="conference_paper">Conference Paper</option>
                <option value="report">Technical / Institutional Report</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ResourceStatus)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="published">Published (Live in Catalogue)</option>
                <option value="pending">Pending Review (Awaiting Librarian Approval)</option>
                <option value="draft">Draft (Restricted Author View)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Primary Author / Scholar *
              </label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Prof. Alan Turing"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Co-Authors / Contributors
              </label>
              <Input
                value={coAuthors}
                onChange={(e) => setCoAuthors(e.target.value)}
                placeholder="Comma separated names"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Academic Faculty / Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Academic Subject / Discipline
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Access Level & Clearance
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="public">Open Access (Publicly readable & downloadable)</option>
                <option value="registered">Registered Students & Scholars Only</option>
                <option value="staff_only">Staff & Faculty Only</option>
                <option value="restricted">Restricted (Librarian/Admin Authorized Only)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Publication Year
              </label>
              <Input
                type="number"
                value={publicationYear}
                onChange={(e) => setPublicationYear(Number(e.target.value))}
                min={1800}
                max={2030}
              />
            </div>

            {/* Book Specific Metadata */}
            {isBook ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Publisher
                  </label>
                  <Input
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="e.g. Oxford University Press"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Edition
                  </label>
                  <Input
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    placeholder="e.g. 3rd Global Edition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ISBN
                  </label>
                  <Input
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="978-3-16-148410-0"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Academic Supervisor / Advisor
                </label>
                <Input
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  placeholder="e.g. Dr. Jane Goodall"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Total Page Count
              </label>
              <Input
                type="number"
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                min={1}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Keywords & Index Tags (comma separated)
              </label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. Machine Learning, Distributed Systems, Algorithms"
              />
            </div>

            {/* Document File Upload */}
            <div className="space-y-1.5 sm:col-span-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="size-4 text-blue-900 dark:text-blue-400" />
                Upload PDF Manuscript / Document (Max 100MB)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Stored in encrypted private Supabase Storage and served via short-lived signed URLs.
              </p>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 transition-colors">
                  <UploadCloud className="size-3.5" />
                  Select PDF File
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfChange}
                    className="hidden"
                  />
                </label>
                {pdfFile ? (
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="size-3.5" />
                    {pdfFile.name} ({(pdfFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                ) : existingStoragePath ? (
                  <span className="text-xs text-slate-500 font-mono truncate max-w-xs">
                    Current: {existingStoragePath}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">No PDF selected yet</span>
                )}
              </div>
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-1.5 sm:col-span-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="size-4 text-teal-600" />
                Upload Cover Image (Optional, Max 5MB)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Recommended 600x900px JPG, PNG, or WebP.
              </p>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500 transition-colors">
                  <UploadCloud className="size-3.5" />
                  Select Cover Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
                {coverPreviewUrl && (
                  <div className="relative size-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                    <Image
                      src={coverPreviewUrl}
                      alt="Cover Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreviewUrl(null);
                      }}
                      className="absolute top-0.5 right-0.5 size-4 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-rose-600"
                    >
                      <X className="size-2.5" />
                    </button>
                  </div>
                )}
                {coverFile && (
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                    {coverFile.name}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description / Overview
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of the work..."
                rows={2}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Academic Abstract
              </label>
              <Textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Scholarly abstract outlining methodology, findings, and contributions..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold"
            >
              {loading ? "Processing..." : resourceToEdit ? "Update Resource" : "Submit Resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
