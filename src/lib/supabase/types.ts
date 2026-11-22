export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "librarian" | "lecturer" | "student" | "guest";
export type ResourceType =
  | "book"
  | "thesis"
  | "dissertation"
  | "project"
  | "journal_article"
  | "conference_paper"
  | "report";
export type AccessLevel = "public" | "registered" | "staff_only" | "restricted";
export type ResourceStatus = "draft" | "pending" | "published" | "archived";

export interface DepartmentRow {
  id: string;
  name: string;
  code: string;
  faculty: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  department_id: string | null;
  student_staff_id: string | null;
  phone: string | null;
  bio: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  department?: DepartmentRow | null;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_type: "book" | "research" | "both";
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface KeywordRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface ResourceRow {
  id: string;
  title: string;
  slug: string;
  resource_type: ResourceType;
  author: string;
  co_authors: string[] | null;
  publisher: string | null;
  isbn: string | null;
  edition: string | null;
  publication_year: number | null;
  description: string | null;
  abstract: string | null;
  supervisor: string | null;
  department_id: string | null;
  category_id: string | null;
  access_level: AccessLevel;
  status: ResourceStatus;
  cover_image_url: string | null;
  file_url: string | null;
  storage_path: string | null;
  file_size_bytes: number | null;
  file_type: string | null;
  page_count: number | null;
  view_count: number;
  download_count: number;
  created_by: string | null;
  is_featured: boolean;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  department?: DepartmentRow | null;
  category?: CategoryRow | null;
}

export interface ResourceFileRow {
  id: string;
  resource_id: string;
  file_name: string;
  storage_path: string;
  bucket_name: string;
  file_size_bytes: number;
  mime_type: string;
  version: number;
  uploaded_by: string | null;
  created_at: string;
}

export interface ResourceViewRow {
  id: string;
  resource_id: string;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  viewed_at: string;
}

export interface DownloadRow {
  id: string;
  resource_id: string;
  user_id: string | null;
  ip_address: string | null;
  downloaded_at: string;
}

export interface AuditLogRow {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user?: ProfileRow | null;
}

export interface ReadingListRow {
  id: string;
  user_id: string;
  resource_id: string;
  status: "reading" | "completed" | "want_to_read";
  last_page_read: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  resource?: ResourceRow;
}

export interface SystemSettingRow {
  key: string;
  value: Json;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "approval" | "system";
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      notifications: {
        Row: NotificationRow;
        Insert: Partial<NotificationRow> & Pick<NotificationRow, "user_id" | "title" | "message">;
        Update: Partial<NotificationRow>;
        Relationships: [];
      };
      departments: {
        Row: DepartmentRow;
        Insert: Partial<DepartmentRow> & Pick<DepartmentRow, "name" | "code" | "faculty">;
        Update: Partial<DepartmentRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & Pick<ProfileRow, "id" | "email">;
        Update: Partial<ProfileRow>;
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: CategoryRow;
        Insert: Partial<CategoryRow> & Pick<CategoryRow, "name" | "slug">;
        Update: Partial<CategoryRow>;
        Relationships: [];
      };
      keywords: {
        Row: KeywordRow;
        Insert: Partial<KeywordRow> & Pick<KeywordRow, "name" | "slug">;
        Update: Partial<KeywordRow>;
        Relationships: [];
      };
      resources: {
        Row: ResourceRow;
        Insert: Partial<ResourceRow> &
          Pick<ResourceRow, "title" | "slug" | "resource_type" | "author">;
        Update: Partial<ResourceRow>;
        Relationships: [
          {
            foreignKeyName: "resources_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resources_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      resource_keywords: {
        Row: { resource_id: string; keyword_id: string };
        Insert: { resource_id: string; keyword_id: string };
        Update: { resource_id?: string; keyword_id?: string };
        Relationships: [];
      };
      resource_files: {
        Row: ResourceFileRow;
        Insert: Partial<ResourceFileRow> &
          Pick<ResourceFileRow, "resource_id" | "file_name" | "storage_path">;
        Update: Partial<ResourceFileRow>;
        Relationships: [];
      };
      resource_views: {
        Row: ResourceViewRow;
        Insert: Partial<ResourceViewRow> & Pick<ResourceViewRow, "resource_id">;
        Update: Partial<ResourceViewRow>;
        Relationships: [];
      };
      downloads: {
        Row: DownloadRow;
        Insert: Partial<DownloadRow> & Pick<DownloadRow, "resource_id">;
        Update: Partial<DownloadRow>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: Partial<AuditLogRow> & Pick<AuditLogRow, "action">;
        Update: Partial<AuditLogRow>;
        Relationships: [];
      };
      reading_list: {
        Row: ReadingListRow;
        Insert: Partial<ReadingListRow> & Pick<ReadingListRow, "user_id" | "resource_id">;
        Update: Partial<ReadingListRow>;
        Relationships: [];
      };
      system_settings: {
        Row: SystemSettingRow;
        Insert: Pick<SystemSettingRow, "key" | "value"> & Partial<SystemSettingRow>;
        Update: Partial<SystemSettingRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_auth_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_librarian_or_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_staff: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      can_access_resource: {
        Args: { p_access_level: AccessLevel };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      resource_type_enum: ResourceType;
      access_level_enum: AccessLevel;
      resource_status_enum: ResourceStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
