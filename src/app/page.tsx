"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  Search,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Award,
  Layers,
  FileCheck,
  Clock,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResourceCard } from "@/components/resources/resource-card";
import {
  fetchResources,
  fetchCategories,
  fetchDashboardData,
} from "@/lib/supabase/queries";
import type { ResourceRow, CategoryRow } from "@/lib/supabase/types";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [featured, setFeatured] = useState<ResourceRow[]>([]);
  const [recent, setRecent] = useState<ResourceRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [stats, setStats] = useState<{
    totalResources: number;
    totalBooks: number;
    totalResearch: number;
    totalDownloads: number;
  }>({
    totalResources: 444,
    totalBooks: 142,
    totalResearch: 302,
    totalDownloads: 4820,
  });

  useEffect(() => {
    async function loadLandingData() {
      try {
        const [featuredRes, recentRes, cats, dashboardStats] = await Promise.all([
          fetchResources({ featuredOnly: true, limit: 3 }),
          fetchResources({ sortBy: "newest", limit: 3 }),
          fetchCategories(),
          fetchDashboardData(),
        ]);

        if (featuredRes.resources.length > 0) {
          setFeatured(featuredRes.resources);
        }
        if (recentRes.resources.length > 0) {
          setRecent(recentRes.resources);
        }
        if (cats.length > 0) {
          setCategories(cats.slice(0, 6));
        }
        if (dashboardStats) {
          setStats({
            totalResources: dashboardStats.totalResources,
            totalBooks: dashboardStats.totalBooks,
            totalResearch: dashboardStats.totalResearch,
            totalDownloads: dashboardStats.totalDownloads,
          });
        }
      } catch {
        // Fallbacks already in place
      }
    }
    loadLandingData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/catalog");
    }
  };

  return (
    <div className="space-y-16 pb-16 animate-in fade-in duration-300">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-teal-950 px-6 py-16 sm:px-12 sm:py-24 text-white shadow-2xl">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold text-teal-300 backdrop-blur-md">
            <Sparkles className="size-3.5 text-teal-400" />
            <span>The Premier Institutional Digital Repository</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Scholarly Knowledge & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-blue-200 to-white">
              Academic Literature
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Discover peer-reviewed textbooks, doctoral dissertations, master’s theses, conference proceedings, and faculty publications preserved in the university&apos;s permanent digital archive.
          </p>

          {/* Unified Hero Search Box */}
          <form
            onSubmit={handleSearch}
            className="mx-auto max-w-2xl flex flex-col sm:flex-row gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur-md border border-white/20 shadow-2xl"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3.5 size-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, author, DOI, ISBN, topic, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-white px-4 py-3 pl-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-inner"
              />
            </div>
            <Button
              type="submit"
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-3 h-auto rounded-xl text-sm transition-all shadow-md shadow-teal-500/20"
            >
              Search Repository
            </Button>
          </form>

          {/* Database-sourced Institutional Statistics */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/10 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-400">
                {stats.totalResources.toLocaleString()}+
              </div>
              <div className="text-xs text-slate-300 mt-1">Archived Works</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {stats.totalBooks.toLocaleString()}
              </div>
              <div className="text-xs text-slate-300 mt-1">Academic Books</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                {stats.totalResearch.toLocaleString()}
              </div>
              <div className="text-xs text-slate-300 mt-1">Research Papers</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-300">
                {stats.totalDownloads.toLocaleString()}+
              </div>
              <div className="text-xs text-slate-300 mt-1">Document Downloads</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Two Pillars Section: Digital Library vs Research Repository */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="inline-flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-300 mb-2">
              <BookOpen className="size-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Digital Academic Library
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Curated textbooks, reference manuals, course monographs, and licensed institutional reading across engineering, computing, commerce, and natural sciences.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-blue-600" />
                Comprehensive bibliographic data & ISBN lookups
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-blue-600" />
                Integrated PDF document reader with zoom, navigation & full-screen
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-blue-600" />
                Personal reading lists, bookmarks, and reading progress tracking
              </li>
            </ul>
          </div>
          <div className="pt-6">
            <Link href="/library">
              <Button className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800 text-white gap-2 text-xs">
                Browse Digital Library
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="inline-flex size-12 items-center justify-center rounded-xl bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300 mb-2">
              <GraduationCap className="size-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Research Repository & Archive
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Institutional scholarship preserving doctoral dissertations, postgraduate theses, peer-reviewed journals, and undergraduate capstone research.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-teal-600" />
                Supervisor attribution, departmental categorization, and abstracts
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-teal-600" />
                Granular security with role-based document access policies
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-teal-600" />
                Direct upload portal for faculty, researchers, and librarians
              </li>
            </ul>
          </div>
          <div className="pt-6">
            <Link href="/repository">
              <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white gap-2 text-xs">
                Explore Research Repository
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Featured Works Showcase */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="institutional" className="text-[10px]">
                HIGHLIGHTS
              </Badge>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Featured Scholarly Works
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Top cited dissertations, textbooks, and faculty research
            </p>
          </div>
          <Link href="/catalog" className="text-xs font-semibold text-blue-900 hover:underline dark:text-blue-400">
            View All Catalog &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((res) => (
            <ResourceCard key={res.id} resource={res} />
          ))}
        </div>
      </section>

      {/* 4. Recently Published Resources */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="teal" className="text-[10px]">
                NEW ARRIVALS
              </Badge>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Recently Published Publications
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Latest additions to university faculties and departments
            </p>
          </div>
          <Link href="/repository" className="text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400">
            View Research Repository &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recent.map((res) => (
            <ResourceCard key={res.id} resource={res} />
          ))}
        </div>
      </section>

      {/* 5. Academic Categories Grid */}
      <section className="rounded-2xl bg-slate-100/70 p-8 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            Disciplines
          </Badge>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Browse by Academic Subject
          </h2>
          <p className="text-xs text-slate-500">
            Indexed collections across faculties, departments, and interdisciplinary fields
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalog?category=${cat.id}`}
              className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </span>
                <ArrowRight className="size-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{cat.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. About the Digital Library & Repository */}
      <section className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <Badge variant="institutional" className="text-[10px]">
              ABOUT THE REPOSITORY
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Preserving & Disseminating Institutional Intellectual Output
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              The ICONIC Digital Library and Repository System serves as the central scholarly preservation and dissemination gateway for our university. We ensure that student dissertations, faculty research outputs, and licensed textbook materials are securely archived, peer-indexed, and discoverable by scholars worldwide.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="size-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Tamper-Proof Storage</h4>
                  <p className="text-[11px] text-slate-500">Private buckets with cryptographic signed download URLs</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Award className="size-5 text-blue-900 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Academic Citation</h4>
                  <p className="text-[11px] text-slate-500">Standardized APA, MLA, Chicago, Harvard, and IEEE formats</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 space-y-2">
              <Layers className="size-6 text-blue-900 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Federated Metadata</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Departmental indexing, supervisor attribution, and standardized keywords.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 space-y-2">
              <FileCheck className="size-6 text-teal-600 dark:text-teal-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Granular Clearance</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Role-based access controls for public, registered, and staff documents.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 space-y-2">
              <Clock className="size-6 text-amber-600 dark:text-amber-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Reading Progress</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                In-browser page tracking and synchronized scholar reading activity.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 space-y-2">
              <Compass className="size-6 text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Global Open Access</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Public catalogue accessible to visiting researchers and academic partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Institutional CTA Banner */}
      <section className="rounded-3xl bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 p-8 sm:p-12 text-white text-center space-y-6 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold max-w-xl mx-auto">
          Begin Exploring the University&apos;s Academic Knowledge Base
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
          Create an institutional student or faculty account to access restricted publications, save reading bookmarks, and download permitted manuscripts.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/register">
            <Button size="lg" className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs">
              Register Scholar Account
            </Button>
          </Link>
          <Link href="/catalog">
            <Button size="lg" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs">
              Browse Open Catalog
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
