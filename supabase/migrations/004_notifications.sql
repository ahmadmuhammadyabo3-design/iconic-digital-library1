-- ==============================================================================
-- ICONIC DIGITAL LIBRARY AND REPOSITORY SYSTEM
-- Migration 004: Notifications Table, Indexes & Row-Level Security Policies
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'approval', 'system')),
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users or staff can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Seed initial institutional notifications
DO $$
DECLARE
    v_admin_id UUID;
    v_librarian_id UUID;
BEGIN
    SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
    SELECT id INTO v_librarian_id FROM public.profiles WHERE role = 'librarian' LIMIT 1;

    IF v_admin_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES 
            (v_admin_id, 'System Initialized', 'ICONIC Digital Library and Repository System initialized with security policies.', 'system', '/admin'),
            (v_admin_id, 'Catalog Verification', 'New research publications have been indexed and require review.', 'approval', '/admin/resources');
    END IF;

    IF v_librarian_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES 
            (v_librarian_id, 'New Submission Received', 'Master''s Thesis submitted in Computer Science faculty.', 'info', '/repository');
    END IF;
END $$;
