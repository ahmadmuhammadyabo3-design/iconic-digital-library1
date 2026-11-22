-- ==============================================================================
-- ICONIC DIGITAL LIBRARY AND REPOSITORY SYSTEM
-- Migration 001: Initial Database Schema, RLS Policies, Triggers & Seed Data
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ENUMS & CUSTOM TYPES
-- ==============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'librarian', 'lecturer', 'student', 'guest');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE resource_type_enum AS ENUM (
        'book', 'thesis', 'dissertation', 'project', 
        'journal_article', 'conference_paper', 'report'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE access_level_enum AS ENUM ('public', 'registered', 'staff_only', 'restricted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE resource_status_enum AS ENUM ('draft', 'pending', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. CORE TABLES
-- ==============================================================================

-- Departments / Faculties
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    faculty TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'student',
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    student_staff_id TEXT,
    phone TEXT,
    bio TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category_type TEXT NOT NULL DEFAULT 'both' CHECK (category_type IN ('book', 'research', 'both')),
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Keywords / Tags
CREATE TABLE IF NOT EXISTS public.keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resources (Books, Theses, Dissertations, Papers, Projects, Reports)
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    resource_type resource_type_enum NOT NULL,
    author TEXT NOT NULL,
    co_authors TEXT[] DEFAULT '{}',
    publisher TEXT,
    isbn TEXT,
    edition TEXT,
    publication_year INTEGER CHECK (publication_year >= 1000 AND publication_year <= 2100),
    description TEXT,
    abstract TEXT,
    supervisor TEXT,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    access_level access_level_enum NOT NULL DEFAULT 'public',
    status resource_status_enum NOT NULL DEFAULT 'published',
    cover_image_url TEXT,
    file_url TEXT,
    storage_path TEXT,
    file_size_bytes BIGINT DEFAULT 0,
    file_type TEXT DEFAULT 'application/pdf',
    page_count INTEGER,
    view_count INTEGER NOT NULL DEFAULT 0,
    download_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resource Keywords Junction
CREATE TABLE IF NOT EXISTS public.resource_keywords (
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    keyword_id UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
    PRIMARY KEY (resource_id, keyword_id)
);

-- Resource Files (Versioned storage file records)
CREATE TABLE IF NOT EXISTS public.resource_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    bucket_name TEXT NOT NULL DEFAULT 'resource-files',
    file_size_bytes BIGINT DEFAULT 0,
    mime_type TEXT NOT NULL DEFAULT 'application/pdf',
    version INTEGER NOT NULL DEFAULT 1,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resource Views / Analytics
CREATE TABLE IF NOT EXISTS public.resource_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Downloads Record
CREATE TABLE IF NOT EXISTS public.downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address TEXT,
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Logs (Tamper-evident system activity logging)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reading List / Bookmarks
CREATE TABLE IF NOT EXISTS public.reading_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'want_to_read' CHECK (status IN ('reading', 'completed', 'want_to_read')),
    last_page_read INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, resource_id)
);

-- System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. INDEXES FOR PERFORMANCE & DISCOVERY
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_status ON public.resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_access_level ON public.resources(access_level);
CREATE INDEX IF NOT EXISTS idx_resources_department ON public.resources(department_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_year ON public.resources(publication_year);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON public.resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_is_featured ON public.resources(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_resources_search ON public.resources USING gin(to_tsvector('english', title || ' ' || author || ' ' || coalesce(description, '') || ' ' || coalesce(abstract, '')));

CREATE INDEX IF NOT EXISTS idx_views_resource ON public.resource_views(resource_id);
CREATE INDEX IF NOT EXISTS idx_views_date ON public.resource_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_downloads_resource ON public.downloads(resource_id);
CREATE INDEX IF NOT EXISTS idx_downloads_date ON public.downloads(downloaded_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 4. SECURITY DEFINER HELPER FUNCTIONS
-- ==============================================================================

-- Get current authenticated user's role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    RETURN coalesce(v_role, 'guest'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_auth_role() = 'admin'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if current user is librarian or admin
CREATE OR REPLACE FUNCTION public.is_librarian_or_admin()
RETURNS BOOLEAN AS $$
DECLARE
    r user_role;
BEGIN
    r := public.get_auth_role();
    RETURN r = 'admin'::user_role OR r = 'librarian'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if current user is staff (lecturer, librarian, admin)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
DECLARE
    r user_role;
BEGIN
    r := public.get_auth_role();
    RETURN r IN ('admin'::user_role, 'librarian'::user_role, 'lecturer'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Access check for resource reading/downloading
CREATE OR REPLACE FUNCTION public.can_access_resource(p_access_level access_level_enum)
RETURNS BOOLEAN AS $$
DECLARE
    v_uid UUID;
    v_role user_role;
BEGIN
    v_uid := auth.uid();
    IF p_access_level = 'public' THEN
        RETURN true;
    ELSIF p_access_level = 'registered' THEN
        RETURN v_uid IS NOT NULL;
    ELSIF p_access_level = 'staff_only' THEN
        RETURN public.is_staff();
    ELSIF p_access_level = 'restricted' THEN
        RETURN public.is_librarian_or_admin();
    END IF;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: auto-create profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role user_role := 'student';
BEGIN
    -- Check if first user ever, assign admin
    IF (SELECT count(*) FROM public.profiles) = 0 THEN
        default_role := 'admin';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'avatar_url', ''),
        default_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: prevent non-admins from updating their own role
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
    -- If role is changing, verify current user is admin
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Only administrators can modify user roles.';
        END IF;
    END IF;
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- Trigger: update timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_resources_updated_at ON public.resources;
CREATE TRIGGER trg_resources_updated_at
    BEFORE UPDATE ON public.resources
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Departments: Public can view, Admins/Librarians can manage
CREATE POLICY "Departments are viewable by everyone" ON public.departments
    FOR SELECT USING (true);
CREATE POLICY "Departments are manageable by admins and librarians" ON public.departments
    FOR ALL USING (public.is_librarian_or_admin());

-- Profiles: Users can view all active profiles, can update their own profile (non-role fields), Admins can manage all
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins have full access to profiles" ON public.profiles
    FOR ALL USING (public.is_admin());

-- Categories: Public can view, Admins/Librarians can manage
CREATE POLICY "Categories viewable by everyone" ON public.categories
    FOR SELECT USING (true);
CREATE POLICY "Categories manageable by admins and librarians" ON public.categories
    FOR ALL USING (public.is_librarian_or_admin());

-- Keywords: Public can view, Staff can insert, Admins/Librarians can manage
CREATE POLICY "Keywords viewable by everyone" ON public.keywords
    FOR SELECT USING (true);
CREATE POLICY "Keywords insertable by staff" ON public.keywords
    FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Keywords manageable by admins and librarians" ON public.keywords
    FOR ALL USING (public.is_librarian_or_admin());

-- Resources:
-- Read: Depends on access level and published status
CREATE POLICY "Resources visible according to access level" ON public.resources
    FOR SELECT USING (
        (status = 'published' AND NOT is_archived AND public.can_access_resource(access_level))
        OR (created_by = auth.uid())
        OR public.is_librarian_or_admin()
    );

-- Insert: Staff (Lecturers can upload permitted research, Librarians and Admins can upload anything)
CREATE POLICY "Resources insertable by staff and librarians" ON public.resources
    FOR INSERT WITH CHECK (
        public.is_staff()
    );

-- Update: Creator can update drafts/pending; Librarians and Admins can update all
CREATE POLICY "Resources updatable by author or managers" ON public.resources
    FOR UPDATE USING (
        (created_by = auth.uid() AND status IN ('draft', 'pending'))
        OR public.is_librarian_or_admin()
    );

-- Delete / Archive: Only Admins and Librarians can delete/archive
CREATE POLICY "Resources deletable by admins and librarians" ON public.resources
    FOR DELETE USING (public.is_librarian_or_admin());

-- Resource Keywords Junction
CREATE POLICY "Resource keywords viewable by everyone" ON public.resource_keywords
    FOR SELECT USING (true);
CREATE POLICY "Resource keywords manageable by staff and librarians" ON public.resource_keywords
    FOR ALL USING (public.is_staff());

-- Resource Files
CREATE POLICY "Resource files readable if resource accessible" ON public.resource_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.resources r 
            WHERE r.id = resource_files.resource_id 
            AND (public.can_access_resource(r.access_level) OR public.is_librarian_or_admin())
        )
    );
CREATE POLICY "Resource files manageable by staff and librarians" ON public.resource_files
    FOR ALL USING (public.is_staff());

-- Resource Views: Insertable by anyone, viewable by staff/admins
CREATE POLICY "Views insertable by everyone" ON public.resource_views
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Views readable by staff and admins" ON public.resource_views
    FOR SELECT USING (public.is_staff());

-- Downloads: Insertable by users who can access the resource, viewable by staff/admins
CREATE POLICY "Downloads insertable by authenticated users" ON public.downloads
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Downloads readable by staff and admins" ON public.downloads
    FOR SELECT USING (public.is_staff());

-- Audit Logs: Viewable only by Admins, insertable by system/authenticated actions
CREATE POLICY "Audit logs readable only by admins" ON public.audit_logs
    FOR SELECT USING (public.is_admin());
CREATE POLICY "Audit logs insertable by authenticated system" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Reading list: Users can only see and manage their own bookmarks
CREATE POLICY "Users manage their own reading list" ON public.reading_list
    FOR ALL USING (auth.uid() = user_id);

-- System Settings: Viewable by authenticated, manageable only by Admins
CREATE POLICY "Settings viewable by authenticated users" ON public.system_settings
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Settings manageable only by admins" ON public.system_settings
    FOR ALL USING (public.is_admin());

-- ==============================================================================
-- 6. INITIAL INSTITUTIONAL SEED DATA
-- ==============================================================================

-- Initial Departments
INSERT INTO public.departments (id, name, code, faculty, description) VALUES
('d1111111-1111-1111-1111-111111111111', 'Computer Science & Software Engineering', 'CSSE', 'Faculty of Computing & Information Technology', 'Undergraduate and postgraduate programs in software development, AI, and systems.'),
('d2222222-2222-2222-2222-222222222222', 'Information Systems & Cybersecurity', 'ISCS', 'Faculty of Computing & Information Technology', 'Data security, enterprise network management, and information governance.'),
('d3333333-3333-3333-3333-333333333333', 'Electrical & Electronic Engineering', 'EEE', 'Faculty of Engineering & Built Environment', 'Power systems, microelectronics, signal processing, and robotics.'),
('d4444444-4444-4444-4444-444444444444', 'Business Administration & Management', 'BAM', 'Faculty of Business & Social Sciences', 'Strategic management, corporate finance, and organisational leadership.'),
('d5555555-5555-5555-5555-555555555555', 'Economics & Public Policy', 'EPP', 'Faculty of Business & Social Sciences', 'Macroeconomics, microeconomic theory, and public policy formulation.')
ON CONFLICT (code) DO NOTHING;

-- Initial Categories
INSERT INTO public.categories (id, name, slug, description, category_type) VALUES
('c1111111-1111-1111-1111-111111111111', 'Computer Science & Artificial Intelligence', 'computer-science-ai', 'Machine learning, algorithms, databases, and programming.', 'both'),
('c2222222-2222-2222-2222-222222222222', 'Data Science & Big Data Analytics', 'data-science-analytics', 'Data mining, statistical learning, and analytics engineering.', 'both'),
('c3333333-3333-3333-3333-333333333333', 'Information Security & Cryptography', 'security-cryptography', 'Network defense, threat intelligence, and cryptographic protocols.', 'both'),
('c4444444-4444-4444-4444-444444444444', 'Engineering & Applied Sciences', 'engineering-applied-sciences', 'Mechanical, electrical, and systems engineering research.', 'both'),
('c5555555-5555-5555-5555-555555555555', 'Economics, Finance & Banking', 'economics-finance', 'Econometrics, investment analysis, and financial institutions.', 'both'),
('c6666666-6666-6666-6666-666666666666', 'Educational Technology & Pedagogy', 'edtech-pedagogy', 'Higher education methodologies and digital curriculum design.', 'both')
ON CONFLICT (slug) DO NOTHING;

-- Initial System Settings
INSERT INTO public.system_settings (key, value, description) VALUES
('institution_name', '"ICONIC Digital Library & Repository"'::jsonb, 'Official title of the institutional repository'),
('max_upload_size_mb', '50'::jsonb, 'Maximum permitted PDF upload size in Megabytes'),
('allowed_mime_types', '["application/pdf", "image/jpeg", "image/png", "image/webp"]'::jsonb, 'Whitelisted file types for storage'),
('allow_guest_browsing', 'true'::jsonb, 'Permit unauthenticated guests to search public catalog'),
('default_access_level', '"registered"'::jsonb, 'Default access level assigned to newly uploaded resources')
ON CONFLICT (key) DO NOTHING;
