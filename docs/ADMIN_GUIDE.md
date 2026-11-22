# Administrator & Librarian Guide

## ICONIC Digital Library and Repository System

This handbook provides instructions for university library administrators, repository curators, and department managers.

---

## 1. Access Levels & Privileges

The repository defines 5 role tiers:

| Role | Hierarchy Level | Capabilities |
| :--- | :---: | :--- |
| **Administrator** | 5 | Complete system management, user role promotion, audit trail inspection, system settings. |
| **Librarian / Curator** | 4 | Add/edit/archive books & research materials, manage categories, departments, view circulation reports. |
| **Lecturer / Scholar** | 3 | Submit theses, dissertations, and research papers, access staff-only manuscripts. |
| **Student / Member** | 2 | Search catalog, read permitted documents, save reading list bookmarks. |
| **Guest** | 1 | Public browsing of open-access catalog. |

---

## 2. Administration Modules

### 2.1 Catalog Management (`/admin/resources`)
- **Add Resource**: Click **Add Resource** to open the modal. Select type (`book`, `thesis`, `dissertation`, `project`, `journal_article`, `report`), enter author, supervisor, publisher, ISBN, and page count.
- **Edit Resource**: Click the blue edit icon on any row to update bibliographic metadata.
- **Archive Resource**: Click the red trash icon to soft-delete the resource. Archived items are removed from circulation while preserving database integrity.

### 2.2 User & Role Management (`/admin/users`) *(Admin Only)*
- Review all registered university members, emails, departments, and matriculation IDs.
- **Promote / Change Role**: Click **Change Role** on a member row. Choose **Lecturer**, **Librarian**, or **Administrator**. Role changes are logged to `audit_logs` and protected by server-side triggers.

### 2.3 Category Management (`/admin/categories`)
- Define discipline taxonomy for indexing resources.
- Specify whether a category applies to Books, Research, or Both.

### 2.4 Faculty & Department Management (`/admin/departments`)
- Register university faculties (e.g. Faculty of Computing & Information Technology) and departments (e.g. CSSE, ISCS, EEE, BAM).

### 2.5 Reports & Analytics (`/admin/reports`)
- Monitor total catalog growth, circulation velocity, and download counts.
- Inspect departmental distribution charts.
- Export analytics reports as formatted `.csv` spreadsheets.

### 2.6 Security Audit Trail (`/admin/audit-logs`) *(Admin Only)*
- Tamper-evident operational audit trail.
- Filter by action (`RESOURCE_CREATED`, `USER_ROLE_CHANGED`, `FILE_DOWNLOADED`, `SETTINGS_UPDATED`).
- Review client IP addresses and timestamps.

### 2.7 System Settings (`/admin/settings`) *(Admin Only)*
- Update institution title and repository branding.
- Configure document upload quotas (default: 50 MB).
- Toggle public guest browsing.
- Set default access level for new submissions.
