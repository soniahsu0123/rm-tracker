-- user_permissions table: individual permission overrides per user
-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  allowed boolean NOT NULL,
  UNIQUE(user_id, action)
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Managers and admins can read all user permissions
CREATE POLICY "Managers and admins can read user_permissions"
  ON public.user_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );
