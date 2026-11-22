import type { UserRole, AccessLevel, ResourceType } from "../supabase/types";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  librarian: 4,
  lecturer: 3,
  student: 2,
  guest: 1,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  librarian: "Librarian / Repository Manager",
  lecturer: "Lecturer / Researcher",
  student: "Student / Registered User",
  guest: "Guest (Public)",
};

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  public: "Public Access",
  registered: "Registered Users Only",
  staff_only: "Faculty & Staff Only",
  restricted: "Restricted (Librarian/Admin Only)",
};

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  book: "Academic Book",
  thesis: "Master's Thesis",
  dissertation: "Doctoral Dissertation",
  project: "Undergraduate Project",
  journal_article: "Journal Article",
  conference_paper: "Conference Paper",
  report: "Technical & Institutional Report",
};

/**
 * Checks if user has at least the required role in hierarchy
 */
export function hasMinRole(userRole: UserRole | undefined, minRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

/**
 * Checks if user has one of the specific allowed roles
 */
export function hasRole(userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Complete administrative permissions
 */
export function canManageUsers(userRole: UserRole | undefined): boolean {
  return userRole === "admin";
}

/**
 * Can manage categories, departments, and repository records
 */
export function canManageCatalog(userRole: UserRole | undefined): boolean {
  return userRole === "admin" || userRole === "librarian";
}

/**
 * Can upload materials:
 * - Admin & Librarian: Any resource
 * - Lecturer: Research publications, theses, dissertations, projects, journal articles
 * - Student/Guest: None
 */
export function canUploadResource(userRole: UserRole | undefined, type?: ResourceType): boolean {
  if (!userRole) return false;
  if (userRole === "admin" || userRole === "librarian") return true;
  if (userRole === "lecturer") {
    // Lecturers can upload research papers, capstones, and theses
    return !type || type !== "book";
  }
  return false;
}

/**
 * Checks if user is permitted to view a resource
 */
export function canViewResource(
  userRole: UserRole | undefined,
  accessLevel: AccessLevel,
  isOwner = false
): boolean {
  if (isOwner) return true;
  if (userRole === "admin" || userRole === "librarian") return true;

  switch (accessLevel) {
    case "public":
      return true;
    case "registered":
      return !!userRole && userRole !== "guest";
    case "staff_only":
      return userRole === "lecturer";
    case "restricted":
      return false;
    default:
      return false;
  }
}

/**
 * Checks if user is permitted to download a document
 */
export function canDownloadResource(
  userRole: UserRole | undefined,
  accessLevel: AccessLevel,
  isOwner = false
): boolean {
  return canViewResource(userRole, accessLevel, isOwner);
}
