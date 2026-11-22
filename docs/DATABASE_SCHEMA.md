# Database Schema & Security Architecture

## ICONIC Digital Library and Repository System

This document specifies the PostgreSQL relational schema, Row Level Security (RLS) policies, triggers, and storage configuration for the ICONIC Digital Library and Repository System.

---

## 1. Entity-Relationship Overview

```
auth.users (Supabase Auth)
     │ 1:1
     ▼
  profiles ──────────┐
     │ 1:N           │ 1:N
     ▼               ▼
 resources ◄─── resource_keywords ───► keywords
     │ 1:N
     ├─► resource_files (Storage references)
     ├─► resource_views (Analytics tracking)
     ├─► downloads      (Circulation logging)
     └─► reading_list   (User bookmarks & progress)

 departments ───► profiles (optional faculty affiliation)
             ───► resources (departmental publishing)

 categories  ───► resources (discipline indexing)

 audit_logs  ───► profiles (tamper-evident system activity)
 system_settings
```

---

## 2. Table Specifications

### 2.1 `profiles`
Extends Supabase `auth.users` with institutional scholar information.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK, FK `auth.users(id)` ON DELETE CASCADE | Matches authentication user ID |
| `email` | `TEXT` | NOT NULL | Institutional email address |
| `full_name` | `TEXT` | NULLABLE | Legal/academic name |
| `avatar_url` | `TEXT` | NULLABLE | Avatar image in `profile-images` bucket |
| `role` | `user_role` | NOT NULL DEFAULT `'student'` | Enum: `admin`, `librarian`, `lecturer`, `student`, `guest` |
| `department_id` | `UUID` | FK `departments(id)` ON DELETE SET NULL | Affiliated academic department |
| `student_staff_id` | `TEXT` | NULLABLE | Student matriculation number or staff ID |
| `phone` | `TEXT` | NULLABLE | Contact telephone |
| `bio` | `TEXT` | NULLABLE | Academic biography & research interests |
| `is_active` | `BOOLEAN` | NOT NULL DEFAULT `true` | Account active flag |
| `last_login_at` | `TIMESTAMPTZ` | NULLABLE | Last session timestamp |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` | Last modification timestamp |

### 2.2 `departments`
University faculties and academic departments.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK DEFAULT `gen_random_uuid()` | Unique department ID |
| `name` | `TEXT` | NOT NULL UNIQUE | Department title |
| `code` | `TEXT` | NOT NULL UNIQUE | Department abbreviation (e.g. `CSSE`, `ISCS`) |
| `faculty` | `TEXT` | NOT NULL | Parent school/faculty division |
| `description` | `TEXT` | NULLABLE | Scope and focus areas |

### 2.3 `categories`
Subject taxonomy for books and research works.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK DEFAULT `gen_random_uuid()` | Unique category ID |
| `name` | `TEXT` | NOT NULL | Category name |
| `slug` | `TEXT` | NOT NULL UNIQUE | URL-safe identifier |
| `category_type` | `TEXT` | NOT NULL DEFAULT `'both'` | Enum check: `'book'`, `'research'`, `'both'` |
| `parent_id` | `UUID` | FK `categories(id)` ON DELETE SET NULL | Hierarchy parent |

### 2.4 `resources`
Core table for all cataloged academic publications and library textbooks.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK DEFAULT `gen_random_uuid()` | Unique resource ID |
| `title` | `TEXT` | NOT NULL | Full manuscript title |
| `slug` | `TEXT` | NOT NULL | URL identifier |
| `resource_type` | `resource_type_enum` | NOT NULL | `book`, `thesis`, `dissertation`, `project`, `journal_article`, `conference_paper`, `report` |
| `author` | `TEXT` | NOT NULL | Primary researcher / author |
| `co_authors` | `TEXT[]` | DEFAULT `'{}'` | Co-authors or researchers |
| `publisher` | `TEXT` | NULLABLE | Publishing press (for books) |
| `isbn` | `TEXT` | NULLABLE | ISBN (books) or ISSN (journals) |
| `edition` | `TEXT` | NULLABLE | Edition (e.g. 4th Edition) |
| `publication_year`| `INTEGER` | CHECK (1000 - 2100) | Publication year |
| `description` | `TEXT` | NULLABLE | Overview synopsis |
| `abstract` | `TEXT` | NULLABLE | Scholarly abstract |
| `supervisor` | `TEXT` | NULLABLE | Thesis advisor / principal investigator |
| `department_id` | `UUID` | FK `departments(id)` | Academic affiliation |
| `category_id` | `UUID` | FK `categories(id)` | Discipline taxonomy |
| `access_level` | `access_level_enum` | DEFAULT `'public'` | `public`, `registered`, `staff_only`, `restricted` |
| `status` | `resource_status_enum`| DEFAULT `'published'`| `draft`, `pending`, `published`, `archived` |
| `cover_image_url` | `TEXT` | NULLABLE | Cover image URI |
| `file_url` | `TEXT` | NULLABLE | Direct URL or storage URI |
| `storage_path` | `TEXT` | NULLABLE | Relative path inside `resource-files` bucket |
| `file_size_bytes` | `BIGINT` | DEFAULT 0 | Document file size in bytes |
| `file_type` | `TEXT` | DEFAULT `'application/pdf'`| MIME type |
| `page_count` | `INTEGER` | NULLABLE | Total manuscript pages |
| `view_count` | `INTEGER` | NOT NULL DEFAULT 0 | Cumulative consultations |
| `download_count` | `INTEGER` | NOT NULL DEFAULT 0 | Cumulative circulation downloads |
| `created_by` | `UUID` | FK `profiles(id)` | Uploader ID |
| `is_featured` | `BOOLEAN` | DEFAULT `false` | Highlighted showcase |
| `is_archived` | `BOOLEAN` | DEFAULT `false` | Soft deletion status |

### 2.5 `audit_logs`
Tamper-evident activity trail for compliance and institutional security.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK DEFAULT `gen_random_uuid()` | Audit log event ID |
| `user_id` | `UUID` | FK `profiles(id)` | User who triggered the action |
| `action` | `TEXT` | NOT NULL | e.g. `USER_ROLE_CHANGED`, `RESOURCE_CREATED` |
| `entity_type` | `TEXT` | NULLABLE | `resource`, `user`, `category`, `setting` |
| `entity_id` | `TEXT` | NULLABLE | Target entity UUID |
| `details` | `JSONB` | DEFAULT `'{}'` | JSON event payload |
| `ip_address` | `TEXT` | NULLABLE | Client IP address |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Immutable timestamp |

---

## 3. Row Level Security (RLS) Policies

All tables have RLS enabled:
- **`profiles`**:
  - `SELECT`: Authenticated users can view active scholar profiles.
  - `UPDATE`: Users can update non-privileged profile fields (full name, phone, bio). Trigger `trg_protect_profile_role` blocks any non-admin from modifying `role`.
  - `ALL`: Administrators have full write access.
- **`resources`**:
  - `SELECT`: Public can read `status = 'published'` and `access_level = 'public'`. Authenticated users can read `registered`. Staff can read `staff_only`. Librarians/Admins can read `restricted`.
  - `INSERT`: Staff members (`admin`, `librarian`, `lecturer`) can upload permitted materials.
  - `UPDATE / DELETE`: Authors can edit drafts; Librarians and Administrators can manage all.
- **`audit_logs`**:
  - `SELECT`: Accessible exclusively by Administrators (`is_admin() = true`).
  - `INSERT`: Open for system telemetry.
  - `UPDATE / DELETE`: Denied to all users (immutable audit trail).

---

## 4. Storage Buckets & Policies

1. **`resource-files`** (Private, 50 MB limit, `application/pdf`):
   - Access restricted to authorized users via short-lived signed URLs generated by `getSignedDocumentUrl()`.
   - Direct download links never expose raw storage paths.
2. **`resource-covers`** (Public, 5 MB limit, JPEG/PNG/WebP):
   - Public read for rendering book covers and thumbnails in the catalogue.
3. **`profile-images`** (Public, 2 MB limit):
   - Users can upload avatars to their own user directory `[uid]/avatar.png`.
