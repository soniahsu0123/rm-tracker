/**
 * Creates user_permissions table via Supabase Management API.
 * Run: node scripts/create-user-permissions-table.mjs
 * Requires: SUPABASE_ACCESS_TOKEN env var (from supabase.com/dashboard → Account → Access tokens)
 */
const PROJECT_REF = 'jylwszoaqqpbzcukfbcm'
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!TOKEN) {
  console.error('Missing SUPABASE_ACCESS_TOKEN')
  console.error('Get it from: https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const SQL = `
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  allowed boolean NOT NULL,
  UNIQUE(user_id, action)
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Managers and admins can read user_permissions"
  ON public.user_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );
`

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: SQL }),
})

const data = await res.json()
if (!res.ok) {
  console.error('Error:', JSON.stringify(data, null, 2))
  process.exit(1)
}
console.log('Success: user_permissions table created')
