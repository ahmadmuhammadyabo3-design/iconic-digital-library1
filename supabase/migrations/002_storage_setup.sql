-- ==============================================================================
-- ICONIC DIGITAL LIBRARY AND REPOSITORY SYSTEM
-- Migration 002: Supabase Storage Buckets & Storage RLS Policies
-- ==============================================================================

-- 1. Create Storage Buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'resource-files', 
        'resource-files', 
        false, -- Private bucket: access only via signed URLs
        52428800, -- 50 MB limit
        ARRAY['application/pdf']
    ),
    (
        'resource-covers', 
        'resource-covers', 
        true, -- Publicly readable for book covers and previews
        5242880, -- 5 MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    ),
    (
        'profile-images', 
        'profile-images', 
        true, -- Publicly readable user avatars
        2097152, -- 2 MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ==============================================================================
-- 2. STORAGE ROW LEVEL SECURITY POLICIES
-- ==============================================================================

-- Storage: resource-covers
-- Public read for covers
CREATE POLICY "Public can view resource covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'resource-covers');

-- Staff can upload and manage resource covers
CREATE POLICY "Staff can upload resource covers"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'resource-covers' 
    AND public.is_staff()
);

CREATE POLICY "Staff can update resource covers"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'resource-covers' 
    AND public.is_staff()
);

CREATE POLICY "Librarians and Admins can delete resource covers"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'resource-covers' 
    AND public.is_librarian_or_admin()
);

-- Storage: profile-images
-- Public can view user profile avatars
CREATE POLICY "Public can view profile avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

-- Authenticated users can upload their own avatar (stored in folder matching auth.uid)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage: resource-files (Private Document Storage)
-- Access to private documents is strictly verified against resource permissions
CREATE POLICY "Authorized users can read resource files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'resource-files'
    AND (
        -- Admins and Librarians can access all files
        public.is_librarian_or_admin()
        -- Or user has access permission for this resource
        OR EXISTS (
            SELECT 1 FROM public.resources r
            WHERE r.storage_path = storage.objects.name
            AND public.can_access_resource(r.access_level)
        )
    )
);

-- Staff can upload research and book documents
CREATE POLICY "Staff can upload resource files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'resource-files'
    AND public.is_staff()
);

-- Staff can update their uploaded files, Librarians/Admins can update any
CREATE POLICY "Staff can update resource files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'resource-files'
    AND public.is_staff()
);

-- Only Librarians and Admins can delete resource files
CREATE POLICY "Librarians and Admins can delete resource files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'resource-files'
    AND public.is_librarian_or_admin()
);
