import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Navbar from '@/components/Navbar'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const isManager = profile.role === 'manager' || profile.role === 'admin'
  const today = new Date().toISOString().split('T')[0]

  // Auto-sync active projects past their due date → delayed
  let overdueQuery = supabase
    .from('projects')
    .select('id')
    .eq('status', 'active')
    .lt('due_date', today)

  if (!isManager) overdueQuery = overdueQuery.eq('owner_id', user.id)

  const { data: overdueProjects } = await overdueQuery

  if (overdueProjects && overdueProjects.length > 0) {
    const admin = createAdminClient()
    const ids = overdueProjects.map(p => p.id)
    await admin.from('projects').update({ status: 'delayed' }).in('id', ids)
  }

  // Badge = all delayed projects (includes just-synced ones)
  let delayedQuery = supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'delayed')

  if (!isManager) delayedQuery = delayedQuery.eq('owner_id', user.id)

  const { count: delayedCount } = await delayedQuery

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar profile={profile} delayedCount={delayedCount ?? 0} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
