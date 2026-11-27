# ICONIC Digital Library and Repository System

A modern institutional digital library, research repository, and open-access archive built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, and **Supabase**.

---

## 👥 Team Members & Contributors

- **Student Lead**: Ahmad Muhammad Yabo(https://github.com/ahmadmuhammadyabo3-design)
- **Team Member 2**: Ibrahim Muhammad Yabo (https://github.com/imuhammadyabo)
- **Team Member 3**: Hamza Sulyman (https://github.com/hmzs26)
4. supervisor 
Supervisor proffkebi@gmail.com


## Features

- **Institutional Aesthetic**: Professional university navy blue, white, and subtle teal accents.
- **Role-Based Access Control (RBAC)**:
  - **Administrator**: Complete system oversight, user role assignments, audit logs, system settings.
  - **Librarian / Curator**: Manage book catalog, research repository records, categories, and circulation reports.
  - **Lecturer / Researcher**: Upload and advise research materials, access staff-only manuscripts.
  - **Student / Registered User**: Search, read online in PDF viewer, download permitted materials, manage reading list.
  - **Guest**: Browse open-access public resources.
- **Digital Library**: Academic book catalog, ISBN tracking, edition tracking, grid and table views, book detail views with citation generator (APA 7th & IEEE).
- **Research Repository**: Academic archive for dissertations, master's theses, final-year capstone projects, peer-reviewed articles, and technical reports.
- **Unified Discovery Engine**: Instant multi-facet search by title, author, keyword, department, category, and access level.
- **Integrated PDF Document Reader**: Embedded viewer with page navigation, zoom in/out, rotation, full-screen mode, metadata panel, and permission-checked downloads.
- **Institutional Analytics & Reports**: Recharts visualizations for monthly circulation, resource distribution, and departmental activity with date filters and CSV export.
- **Tamper-Evident Security Audit Logs**: Complete logging of user authentications, resource uploads, downloads, and role updates.
- **Supabase Backend**: Normalized PostgreSQL tables, Row Level Security (RLS) on all user-accessible tables, database triggers, and private storage with temporary signed URLs.

---

## Tech Stack

- **Framework**: Next.js 16.4.6 (App Router with Turbopack)
- **UI Library**: React 19.3.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 & tw-animate-css
- **Components**: shadcn/ui with Base UI primitives
- **Database & Auth**: Supabase PostgreSQL & Supabase Auth
- **Storage**: Supabase Storage (`resource-files`, `resource-covers`, `profile-images`)
- **Analytics**: Recharts
- **Icons**: Lucide React

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
cd iconic-digital-library
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-publishable-key
```

### 3. Apply Supabase Database Migrations

In your [Supabase Project SQL Editor](https://supabase.com/dashboard):
1. Run [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql)
2. Run [`supabase/migrations/002_storage_setup.sql`](./supabase/migrations/002_storage_setup.sql)
3. *(Optional)* Run [`supabase/migrations/003_sample_resources.sql`](./supabase/migrations/003_sample_resources.sql)

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Detailed Documentation

- [Database Schema & Security Architecture](docs/DATABASE_SCHEMA.md)
- [User Guide](docs/USER_GUIDE.md)
- [Administrator & Librarian Guide](docs/ADMIN_GUIDE.md)
- [Deployment & Supabase Setup Guide](docs/DEPLOYMENT_GUIDE.md)
- [Testing & Verification Report](docs/TESTING_REPORT.md)

---

## License

Institutional Property. All rights reserved.
