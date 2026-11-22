"use client";

import React from "react";
import Link from "next/link";
import { Eye, Download, BookOpen, Trash2, Edit, CheckCircle } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ACCESS_LEVEL_LABELS, RESOURCE_TYPE_LABELS } from "@/lib/auth/permissions";
import type { ResourceRow } from "@/lib/supabase/types";

interface ResourceTableProps {
  resources: ResourceRow[];
  canManage?: boolean;
  onEdit?: (resource: ResourceRow) => void;
  onDelete?: (id: string) => void;
  onApprove?: (id: string) => void;
}

export function ResourceTable({ resources, canManage, onEdit, onDelete, onApprove }: ResourceTableProps) {
  if (resources.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No resources found</p>
        <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or category filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title & Author</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Access Level</TableHead>
            <TableHead>Year</TableHead>
            <TableHead className="text-right">Activity</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((item) => {
            const isBook = item.resource_type === "book";
            const detailHref = isBook ? `/library/${item.id}` : `/repository/${item.id}`;
            const readerHref = `/reader/${item.id}`;

            return (
              <TableRow key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                <TableCell className="max-w-xs sm:max-w-sm">
                  <Link href={detailHref} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 line-clamp-1">
                    {item.title}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">By {item.author}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={isBook ? "institutional" : "teal"} className="text-[10px] py-0 whitespace-nowrap">
                    {RESOURCE_TYPE_LABELS[item.resource_type] || item.resource_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {item.department?.code || "General"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.status === "published"
                        ? "success"
                        : item.status === "pending"
                        ? "warning"
                        : "secondary"
                    }
                    className="text-[10px] py-0 capitalize whitespace-nowrap"
                  >
                    {item.status || "published"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={item.access_level === "public" ? "success" : "secondary"}
                    className="text-[10px] py-0 whitespace-nowrap"
                  >
                    {ACCESS_LEVEL_LABELS[item.access_level]}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-500">{item.publication_year || "—"}</TableCell>
                <TableCell className="text-right text-xs text-slate-500 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 mr-2" title="Views">
                    <Eye className="size-3 text-slate-400" />
                    {item.view_count}
                  </span>
                  <span className="inline-flex items-center gap-1" title="Downloads">
                    <Download className="size-3 text-slate-400" />
                    {item.download_count}
                  </span>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={readerHref}>
                      <Button variant="ghost" size="icon-xs" title="Read online">
                        <BookOpen className="size-3.5 text-teal-600" />
                      </Button>
                    </Link>
                    {canManage && (
                      <>
                        {onApprove && item.status !== "published" && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onApprove(item.id)}
                            title="Approve & Publish Resource"
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          >
                            <CheckCircle className="size-3.5" />
                          </Button>
                        )}
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onEdit(item)}
                            title="Edit metadata"
                          >
                            <Edit className="size-3.5 text-blue-600" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onDelete(item.id)}
                            title="Archive resource"
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
