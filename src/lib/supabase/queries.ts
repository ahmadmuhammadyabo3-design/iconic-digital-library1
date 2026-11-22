import { supabase } from "./client";
import type {
  ResourceRow,
  DepartmentRow,
  CategoryRow,
  AuditLogRow,
  ProfileRow,
  ReadingListRow,
  UserRole,
  ResourceType,
  AccessLevel,
  NotificationRow,
  ResourceStatus,
} from "./types";
import {
  MOCK_RESOURCES,
  MOCK_DEPARTMENTS,
  MOCK_CATEGORIES,
  MOCK_AUDIT_LOGS,
  MOCK_PROFILES,
  MOCK_READING_LIST,
  MOCK_ANALYTICS_DATA,
  MOCK_NOTIFICATIONS,
} from "./mock-data";

export interface ResourceFilterParams {
  type?: ResourceType | "all_research" | "book" | "all";
  categoryId?: string;
  departmentId?: string;
  search?: string;
  accessLevel?: AccessLevel | "all";
  status?: string;
  sortBy?: "newest" | "oldest" | "title" | "downloads" | "views";
  page?: number;
  limit?: number;
  featuredOnly?: boolean;
  publicationYear?: number;
}

export interface ResourceQueryResult {
  resources: ResourceRow[];
  totalCount: number;
  page: number;
  totalPages: number;
}

/**
 * Unified query for books, research publications, or specific resource types
 */
export async function fetchResources(
  params: ResourceFilterParams = {}
): Promise<ResourceQueryResult> {
  const {
    type = "all",
    categoryId,
    departmentId,
    search,
    accessLevel = "all",
    status = "all",
    sortBy = "newest",
    page = 1,
    limit = 12,
    featuredOnly = false,
    publicationYear,
  } = params;

  try {
    let query = supabase
      .from("resources")
      .select("*, department:departments(*), category:categories(*)", { count: "exact" });

    // Handle resource type filtering
    if (type === "book") {
      query = query.eq("resource_type", "book");
    } else if (type === "all_research") {
      query = query.neq("resource_type", "book");
    } else if (type !== "all" && type) {
      query = query.eq("resource_type", type);
    }

    if (categoryId && categoryId !== "all") {
      query = query.eq("category_id", categoryId);
    }

    if (departmentId && departmentId !== "all") {
      query = query.eq("department_id", departmentId);
    }

    if (publicationYear) {
      query = query.eq("publication_year", publicationYear);
    }

    if (accessLevel && accessLevel !== "all") {
      query = query.eq("access_level", accessLevel);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (featuredOnly) {
      query = query.eq("is_featured", true);
    }

    query = query.eq("is_archived", false);

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      query = query.or(
        `title.ilike.${term},author.ilike.${term},description.ilike.${term},abstract.ilike.${term},isbn.ilike.${term}`
      );
    }

    // Sort order
    switch (sortBy) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "title":
        query = query.order("title", { ascending: true });
        break;
      case "downloads":
        query = query.order("download_count", { ascending: false });
        break;
      case "views":
        query = query.order("view_count", { ascending: false });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error || !data || data.length === 0) {
      // Graceful fallback to mock data if DB table is unpopulated yet
      return filterMockResources(params);
    }

    const total = count || data.length;
    return {
      resources: data as unknown as ResourceRow[],
      totalCount: total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch {
    return filterMockResources(params);
  }
}

/**
 * Filter mock resources for immediate demonstration and offline fallback
 */
function filterMockResources(params: ResourceFilterParams): ResourceQueryResult {
  let list = [...MOCK_RESOURCES];
  const {
    type = "all",
    categoryId,
    departmentId,
    search,
    accessLevel = "all",
    status = "all",
    sortBy = "newest",
    page = 1,
    limit = 12,
    featuredOnly = false,
    publicationYear,
  } = params;

  if (type === "book") {
    list = list.filter((r) => r.resource_type === "book");
  } else if (type === "all_research") {
    list = list.filter((r) => r.resource_type !== "book");
  } else if (type !== "all" && type) {
    list = list.filter((r) => r.resource_type === type);
  }

  if (categoryId && categoryId !== "all") {
    list = list.filter((r) => r.category_id === categoryId);
  }

  if (departmentId && departmentId !== "all") {
    list = list.filter((r) => r.department_id === departmentId);
  }

  if (publicationYear) {
    list = list.filter((r) => r.publication_year === publicationYear);
  }

  if (accessLevel && accessLevel !== "all") {
    list = list.filter((r) => r.access_level === accessLevel);
  }

  if (status && status !== "all") {
    list = list.filter((r) => r.status === status);
  }

  if (featuredOnly) {
    list = list.filter((r) => r.is_featured);
  }

  if (search && search.trim() !== "") {
    const q = search.toLowerCase();
    list = list.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.abstract && r.abstract.toLowerCase().includes(q)) ||
        (r.isbn && r.isbn.toLowerCase().includes(q))
    );
  }

  switch (sortBy) {
    case "oldest":
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      break;
    case "title":
      list.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "downloads":
      list.sort((a, b) => b.download_count - a.download_count);
      break;
    case "views":
      list.sort((a, b) => b.view_count - a.view_count);
      break;
    case "newest":
    default:
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
  }

  // Populate department and category references
  list = list.map((item) => ({
    ...item,
    department: MOCK_DEPARTMENTS.find((d) => d.id === item.department_id) || null,
    category: MOCK_CATEGORIES.find((c) => c.id === item.category_id) || null,
  }));

  const total = list.length;
  const from = (page - 1) * limit;
  const paginated = list.slice(from, from + limit);

  return {
    resources: paginated,
    totalCount: total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/**
 * Fetch a single resource by ID with joined department and category
 */
export async function fetchResourceById(id: string): Promise<ResourceRow | null> {
  try {
    const { data, error } = await supabase
      .from("resources")
      .select("*, department:departments(*), category:categories(*)")
      .eq("id", id)
      .single();

    if (!error && data) {
      return data as unknown as ResourceRow;
    }
  } catch {
    // Continue to fallback
  }

  // Fallback to mock data
  const found = MOCK_RESOURCES.find((r) => r.id === id || r.slug === id);
  if (found) {
    return {
      ...found,
      department: MOCK_DEPARTMENTS.find((d) => d.id === found.department_id) || null,
      category: MOCK_CATEGORIES.find((c) => c.id === found.category_id) || null,
    };
  }
  return null;
}

/**
 * Create a new library book or research repository item
 */
export async function createResource(
  payload: Partial<ResourceRow>
): Promise<{ data: ResourceRow | null; error: string | null }> {
  try {
    const slug = (payload.title || "resource")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const insertData = {
      ...payload,
      slug: `${slug}-${Date.now().toString(36)}`,
      status: payload.status || "published",
      access_level: payload.access_level || "public",
      view_count: 0,
      download_count: 0,
      is_archived: false,
    };

    const { data, error } = await supabase
      .from("resources")
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    await createAuditLog(
      "RESOURCE_CREATED",
      "resource",
      (data as { id: string })?.id,
      { title: payload.title, type: payload.resource_type }
    );

    return { data: data as unknown as ResourceRow, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

/**
 * Update an existing resource
 */
export async function updateResource(
  id: string,
  payload: Partial<ResourceRow>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from("resources")
      .update(payload as never)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await createAuditLog("RESOURCE_UPDATED", "resource", id, { updatedFields: Object.keys(payload) });
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Soft delete or archive a resource
 */
export async function deleteResource(
  id: string,
  soft = true
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (soft) {
      const { error } = await supabase
        .from("resources")
        .update({ is_archived: true, archived_at: new Date().toISOString() } as never)
        .eq("id", id);

      if (error) return { success: false, error: error.message };
      await createAuditLog("RESOURCE_ARCHIVED", "resource", id, {});
    } else {
      const { error } = await supabase.from("resources").delete().eq("id", id);
      if (error) return { success: false, error: error.message };
      await createAuditLog("RESOURCE_DELETED", "resource", id, {});
    }
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Departments fetch
 */
export async function fetchDepartments(): Promise<DepartmentRow[]> {
  try {
    const { data, error } = await supabase.from("departments").select("*").order("name");
    if (!error && data && data.length > 0) {
      return data as DepartmentRow[];
    }
  } catch {
    // Fallback
  }
  return MOCK_DEPARTMENTS;
}

/**
 * Categories fetch
 */
export async function fetchCategories(type?: "book" | "research" | "both"): Promise<CategoryRow[]> {
  try {
    let query = supabase.from("categories").select("*").order("name");
    if (type && type !== "both") {
      query = query.or(`category_type.eq.${type},category_type.eq.both`);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as CategoryRow[];
    }
  } catch {
    // Fallback
  }
  if (type && type !== "both") {
    return MOCK_CATEGORIES.filter((c) => c.category_type === type || c.category_type === "both");
  }
  return MOCK_CATEGORIES;
}

/**
 * Record a document view count
 */
export async function recordView(resourceId: string, userId?: string): Promise<void> {
  try {
    await supabase.from("resource_views").insert({
      resource_id: resourceId,
      user_id: userId || null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    } as never);

    // Call RPC or increment
    await supabase.rpc("increment_view_count" as never, { p_resource_id: resourceId } as never);
  } catch {
    // Non-blocking telemetry
  }
}

/**
 * Record a document download count
 */
export async function recordDownload(resourceId: string, userId?: string): Promise<void> {
  try {
    await supabase.from("downloads").insert({
      resource_id: resourceId,
      user_id: userId || null,
    } as never);

    await supabase.rpc("increment_download_count" as never, { p_resource_id: resourceId } as never);
  } catch {
    // Non-blocking telemetry
  }
}

/**
 * Generate a private signed URL for secure PDF viewing or downloading
 */
export async function getSignedDocumentUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<{ signedUrl: string | null; error: string | null }> {
  try {
    if (!storagePath) {
      return { signedUrl: null, error: "No storage path provided" };
    }

    const { data, error } = await supabase.storage
      .from("resource-files")
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data) {
      // Return safe dummy URL for demo/testing fallback
      return {
        signedUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        error: null,
      };
    }

    return { signedUrl: data.signedUrl, error: null };
  } catch (err) {
    return { signedUrl: null, error: (err as Error).message };
  }
}

/**
 * Audit Log creation
 */
export async function createAuditLog(
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("audit_logs").insert({
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      user_id: user?.id || null,
      details: details || {},
    } as never);
  } catch {
    // Fail silently so audit logging doesn't block UI actions
  }
}

/**
 * Fetch system audit logs for Administrator dashboard
 */
export async function fetchAuditLogs(limit = 20): Promise<AuditLogRow[]> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*, user:profiles(*)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      return data as unknown as AuditLogRow[];
    }
  } catch {
    // Fallback
  }
  return MOCK_AUDIT_LOGS.slice(0, limit);
}

/**
 * Fetch user's reading list / bookmarks
 */
export async function fetchUserReadingList(userId?: string): Promise<ReadingListRow[]> {
  try {
    if (!userId) return MOCK_READING_LIST;

    const { data, error } = await supabase
      .from("reading_list")
      .select("*, resource:resources(*)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as unknown as ReadingListRow[];
    }
  } catch {
    // Fallback
  }
  return MOCK_READING_LIST;
}

/**
 * Toggle bookmark
 */
export async function toggleBookmark(
  userId: string,
  resourceId: string
): Promise<{ isBookmarked: boolean }> {
  try {
    const { data } = await supabase
      .from("reading_list")
      .select("id")
      .eq("user_id", userId)
      .eq("resource_id", resourceId)
      .maybeSingle();

    if (data) {
      await supabase.from("reading_list").delete().eq("id", (data as { id: string }).id);
      return { isBookmarked: false };
    } else {
      await supabase.from("reading_list").insert({
        user_id: userId,
        resource_id: resourceId,
        status: "want_to_read",
      } as never);
      return { isBookmarked: true };
    }
  } catch {
    return { isBookmarked: true };
  }
}

/**
 * Fetch all profiles (Admin User Management)
 */
export async function fetchProfiles(): Promise<ProfileRow[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, department:departments(*)")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as unknown as ProfileRow[];
    }
  } catch {
    // Fallback
  }
  return MOCK_PROFILES.map((p) => ({
    ...p,
    department: MOCK_DEPARTMENTS.find((d) => d.id === p.department_id) || null,
  }));
}

/**
 * Update user role (Admin only)
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole } as never)
      .eq("id", userId);

    if (error) return { success: false, error: error.message };

    await createAuditLog("USER_ROLE_CHANGED", "user", userId, { newRole });
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Fetch aggregated dashboard analytics
 */
export async function fetchDashboardData(role: UserRole = "student") {
  let totalResources = 0;
  let totalBooks = 0;
  let totalResearch = 0;
  let totalUsers = 0;
  let activeUsers = 0;
  let totalDownloads = 0;
  let totalViews = 0;
  let recentResources: ResourceRow[] = [];

  try {
    const [
      resCountResult,
      booksCountResult,
      researchCountResult,
      profilesCountResult,
      activeProfilesCountResult,
      downloadsCountResult,
      viewsCountResult,
      recentResResult,
    ] = await Promise.all([
      supabase.from("resources").select("*", { count: "exact", head: true }).eq("is_archived", false),
      supabase.from("resources").select("*", { count: "exact", head: true }).eq("resource_type", "book").eq("is_archived", false),
      supabase.from("resources").select("*", { count: "exact", head: true }).neq("resource_type", "book").eq("is_archived", false),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("downloads").select("*", { count: "exact", head: true }),
      supabase.from("resource_views").select("*", { count: "exact", head: true }),
      fetchResources({ limit: 5 }),
    ]);

    totalResources = resCountResult.count ?? recentResResult.totalCount ?? 0;
    totalBooks = booksCountResult.count ?? recentResResult.resources.filter((r) => r.resource_type === "book").length;
    totalResearch = researchCountResult.count ?? recentResResult.resources.filter((r) => r.resource_type !== "book").length;
    totalUsers = profilesCountResult.count ?? 0;
    activeUsers = activeProfilesCountResult.count ?? 0;

    totalDownloads = downloadsCountResult.count && downloadsCountResult.count > 0
      ? downloadsCountResult.count
      : recentResResult.resources.reduce((acc, curr) => acc + (curr.download_count || 0), 0);

    totalViews = viewsCountResult.count && viewsCountResult.count > 0
      ? viewsCountResult.count
      : recentResResult.resources.reduce((acc, curr) => acc + (curr.view_count || 0), 0);

    recentResources = recentResResult.resources;
  } catch {
    // Fallback to mock data if completely offline
    const { resources, totalCount } = filterMockResources({ limit: 5 });
    totalResources = totalCount;
    totalBooks = resources.filter((r) => r.resource_type === "book").length;
    totalResearch = resources.filter((r) => r.resource_type !== "book").length;
    totalUsers = MOCK_PROFILES.length;
    activeUsers = MOCK_PROFILES.filter((p) => p.is_active).length;
    totalDownloads = resources.reduce((acc, curr) => acc + (curr.download_count || 0), 0);
    totalViews = resources.reduce((acc, curr) => acc + (curr.view_count || 0), 0);
    recentResources = resources;
  }

  return {
    role,
    totalResources,
    totalBooks,
    totalResearch,
    totalUsers,
    activeUsers,
    totalDownloads,
    totalViews,
    monthlyActivity: MOCK_ANALYTICS_DATA.monthlyActivity,
    resourceDistribution: MOCK_ANALYTICS_DATA.resourceDistribution,
    departmentBreakdown: MOCK_ANALYTICS_DATA.departmentBreakdown,
    recentResources,
  };
}

/**
 * Upload a research document or textbook PDF to private Supabase Storage
 */
export async function uploadResourceFile(
  file: File
): Promise<{ storagePath: string | null; fileName: string; fileSize: number; mimeType: string; error: string | null }> {
  try {
    if (file.type !== "application/pdf") {
      return { storagePath: null, fileName: file.name, fileSize: file.size, mimeType: file.type, error: "Only PDF documents are allowed." };
    }

    const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
    if (file.size > MAX_SIZE) {
      return { storagePath: null, fileName: file.name, fileSize: file.size, mimeType: file.type, error: "Document file exceeds the 100MB limit." };
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `documents/${Date.now()}_${cleanName}`;

    const { error } = await supabase.storage
      .from("resource-files")
      .upload(storagePath, file, { cacheControl: "3600", upsert: true });

    if (error) {
      return { storagePath: null, fileName: file.name, fileSize: file.size, mimeType: file.type, error: error.message };
    }

    return { storagePath, fileName: file.name, fileSize: file.size, mimeType: file.type, error: null };
  } catch (err) {
    return { storagePath: null, fileName: file.name, fileSize: file.size, mimeType: file.type, error: (err as Error).message };
  }
}

/**
 * Upload a book/manuscript cover image to public Supabase Storage
 */
export async function uploadCoverImage(
  file: File
): Promise<{ publicUrl: string | null; error: string | null }> {
  try {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return { publicUrl: null, error: "Invalid image format. Please upload JPG, PNG, or WebP." };
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      return { publicUrl: null, error: "Cover image exceeds the 5MB limit." };
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const path = `covers/${Date.now()}_${cleanName}`;

    const { error } = await supabase.storage
      .from("resource-covers")
      .upload(path, file, { cacheControl: "3600", upsert: true });

    if (error) {
      return { publicUrl: null, error: error.message };
    }

    const { data } = supabase.storage.from("resource-covers").getPublicUrl(path);
    return { publicUrl: data.publicUrl, error: null };
  } catch (err) {
    return { publicUrl: null, error: (err as Error).message };
  }
}

/**
 * Upload profile avatar image to public Supabase Storage
 */
export async function uploadProfileAvatar(
  file: File,
  userId: string
): Promise<{ publicUrl: string | null; error: string | null }> {
  try {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return { publicUrl: null, error: "Invalid image format. Please upload JPG, PNG, or WebP." };
    }

    if (file.size > 2 * 1024 * 1024) {
      return { publicUrl: null, error: "Avatar image exceeds the 2MB limit." };
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `avatars/${userId}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-images")
      .upload(path, file, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      return { publicUrl: null, error: uploadError.message };
    }

    const { data } = supabase.storage.from("profile-images").getPublicUrl(path);
    const publicUrl = data.publicUrl;

    // Update profile record in database
    await supabase.from("profiles").update({ avatar_url: publicUrl } as never).eq("id", userId);

    return { publicUrl, error: null };
  } catch (err) {
    return { publicUrl: null, error: (err as Error).message };
  }
}

/**
 * Update resource status (Publish, Pending Review, Archive)
 */
export async function updateResourceStatus(
  id: string,
  status: ResourceStatus
): Promise<{ success: boolean; error: string | null }> {
  try {
    const isArchived = status === "archived";
    const { error } = await supabase
      .from("resources")
      .update({
        status,
        is_archived: isArchived,
        archived_at: isArchived ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    await createAuditLog(`RESOURCE_STATUS_${status.toUpperCase()}`, "resource", id, { status });
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Fetch notifications for user
 */
export async function fetchUserNotifications(userId?: string): Promise<NotificationRow[]> {
  try {
    if (!userId) return MOCK_NOTIFICATIONS;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data && data.length > 0) {
      return data as NotificationRow[];
    }
  } catch {
    // Fallback to mock notifications
  }
  return MOCK_NOTIFICATIONS;
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    await supabase.from("notifications").update({ is_read: true } as never).eq("id", id);
  } catch {
    // Non-blocking
  }
}

/**
 * Mark all user notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    await supabase.from("notifications").update({ is_read: true } as never).eq("user_id", userId);
  } catch {
    // Non-blocking
  }
}

