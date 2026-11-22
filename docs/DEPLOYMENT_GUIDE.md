# Deployment & Supabase Setup Guide

## ICONIC Digital Library and Repository System

This guide outlines exact, step-by-step instructions to configure Supabase, apply database migrations, configure storage buckets, provision administrator accounts, configure production SMTP, and deploy the application to Vercel.

---

## 1. Prerequisites

- Node.js `v20.6+` (or `v24+`)
- Supabase project account (URL & anon key)
- Vercel account (recommended for cloud hosting)
- Custom SMTP provider (SendGrid, Resend, Amazon SES, or Postmark) for production email delivery

---

## 2. Supabase Database & Storage Setup

Migrations `001_initial_schema.sql` through `004_notifications.sql` are located in `supabase/migrations/`.

### Step 2.1: Run Database Schema Migration
1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor** in the left sidebar.
3. Click **New query**.
4. Copy the complete contents of [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql).
5. Paste it into the editor and click **Run**.
6. This creates all normalized tables (`profiles`, `departments`, `categories`, `keywords`, `resources`, `resource_keywords`, `resource_files`, `resource_views`, `downloads`, `audit_logs`, `reading_list`, `system_settings`), RLS security policies, helper functions, and triggers.

### Step 2.2: Run Storage Setup & Storage Policies
1. In the Supabase **SQL Editor**, open another **New query**.
2. Copy the contents of [`supabase/migrations/002_storage_setup.sql`](../supabase/migrations/002_storage_setup.sql).
3. Paste and click **Run**.
4. This registers the required storage buckets:
   - `resource-files` (Private, 50MB limit, `application/pdf`)
   - `resource-covers` (Public, 5MB limit, images)
   - `profile-images` (Public, 2MB limit, images)
   along with granular storage RLS access control policies.

### Step 2.3: Populate Initial Seed Resources
1. In the **SQL Editor**, open a **New query**.
2. Copy the contents of [`supabase/migrations/003_sample_resources.sql`](../supabase/migrations/003_sample_resources.sql).
3. Paste and click **Run**.
4. This adds verified academic sample books, dissertations, and research papers with RFC 4122 UUIDs, faculties, and keywords.

### Step 2.4: Run Notifications Migration
1. In the **SQL Editor**, open a **New query**.
2. Copy the contents of [`supabase/migrations/004_notifications.sql`](../supabase/migrations/004_notifications.sql).
3. Paste and click **Run**.
4. This creates the `notifications` table, real-time read/unread indexing, and user-level RLS security policies.

---

## 3. Creating the Administrator Account

There are two secure methods to initialize your administrator account:

### Method A: Automatic First User Promotion (Built-in Trigger)
The migration includes a bootstrap trigger `handle_new_user()`:
1. Navigate to your deployed app or local server `/register`.
2. Register the first user account (e.g. `admin@your-institution.edu`).
3. Since the `profiles` table is empty on fresh setup, the database trigger automatically grants the `'admin'` role to this first account.

### Method B: SQL Promotion (Direct & Explicit)
If you already registered an account:
1. Go to **Authentication** > **Users** in the Supabase Dashboard and copy the user's `ID` (UUID) or email.
2. In the **SQL Editor**, execute:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'your-admin-email@your-institution.edu';
   ```
3. Verify by querying:
   ```sql
   SELECT id, email, role, full_name FROM public.profiles WHERE role = 'admin';
   ```

---

## 4. Production SMTP & Auth Configuration

> [!IMPORTANT]
> The Supabase default built-in email service is rate-limited to 3 emails per hour on the free tier. For production deployments with active student/faculty signups and password resets, configure an institutional SMTP provider.

### Step 4.1: Custom SMTP Setup
1. In the Supabase Dashboard, go to **Project Settings** > **Authentication** > **SMTP Settings**.
2. Enable **Enable Custom SMTP**.
3. Enter your SMTP server details (e.g., SendGrid, Resend, Amazon SES, or Postmark):
   - **Sender email:** `library-noreply@your-institution.edu`
   - **Sender name:** `ICONIC Digital Library`
   - **Host:** `smtp.sendgrid.net` (or your provider host)
   - **Port:** `587`
   - **User:** `apikey` (or your provider username)
   - **Password:** `<your-api-key>`

### Step 4.2: Auth URL Configuration
1. In the Supabase Dashboard, go to **Authentication** > **URL Configuration**.
2. Set **Site URL** to your production domain:
   - Example: `https://iconic-library.vercel.app`
3. Add the following to **Redirect URLs**:
   - `https://iconic-library.vercel.app/**`
   - `https://iconic-library.vercel.app/reset-password`
   - `http://localhost:3000/**`
   - `http://localhost:3000/reset-password`

---

## 5. Environment Variables

Create `.env.local` inside the `iconic-digital-library` directory:

```bash
# Supabase Public Configuration
NEXT_PUBLIC_SUPABASE_URL=https://oufaxslvhwgavmncmtlg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_cOHJpGe0NkG-dv7feJ9fGA_Gys-PItH
```

> [!CAUTION]
> Never expose your Supabase `service_role` key in any `NEXT_PUBLIC_` variable or client-side code. The anon key is designed for public client usage protected by PostgreSQL Row Level Security (RLS).

---

## 6. Local Development & Verification

Inside the `iconic-digital-library` directory:

```bash
# Run automated production audit suite (57 checks)
npm run audit

# Run ESLint quality checks (0 errors, 0 warnings)
npm run lint

# Build optimized production bundle
npm run build

# Start local Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Vercel Production Deployment

### Option A: Vercel Dashboard (Recommended)
1. Push your repository to GitHub or GitLab.
2. Go to [vercel.com/new](https://vercel.com/new) and select your repository.
3. **IMPORTANT - Root Directory:**
   - Under **General Settings**, click **Edit** next to **Root Directory**.
   - Select or type `iconic-digital-library`.
4. **Environment Variables:**
   Add the following variables under **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://oufaxslvhwgavmncmtlg.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `sb_publishable_cOHJpGe0NkG-dv7feJ9fGA_Gys-PItH`
5. Click **Deploy**.

### Option B: Vercel CLI
```bash
cd "c:\Users\USER\Downloads\Iconic Digital Library and Repository system\iconic-digital-library"
npm install -g vercel
vercel --prod
```

---

## 8. Post-Deployment Verification Checklist

- [ ] Visit home page `/` and confirm hero section, statistics, and featured resources load.
- [ ] Visit `/catalog` and test category filters, department filters, and search.
- [ ] Visit `/library` and test grid/table view toggle.
- [ ] Visit `/repository` and test academic research archive.
- [ ] Test `/login` with institutional credentials.
- [ ] Visit `/admin` with administrator account and verify KPI counts, resource approval workflow, and user role management modal.
- [ ] Test PDF reader `/reader/11111111-1111-1111-1111-111111111111` for zooming, page navigation, and metadata display.
