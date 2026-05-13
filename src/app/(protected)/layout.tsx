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

  // Run overdue check and delayed count in parallel
  let overdueQ = supabase.from('projects').select('id').eq('status', 'active').lt('due_date', today)
  let delayedQ = supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'delayed')
  if (!isManager) {
    overdueQ = overdueQ.eq('owner_id', user.id)
    delayedQ = delayedQ.eq('owner_id', user.id)
  }

  const [{ data: overdueProjects }, { count: delayedCount }] = await Promise.all([overdueQ, delayedQ])

  // Fire-and-forget: sync overdue → delayed without blocking render
  if (overdueProjects && overdueProjects.length > 0) {
    const ids = overdueProjects.map(p => p.id)
    createAdminClient().from('projects').update({ status: 'delayed' }).in('id', ids).then(() => {})
  }

  // Effective badge count = persisted delayed + newly-overdue (not yet written)
  const effectiveDelayedCount = (delayedCount ?? 0) + (overdueProjects?.length ?? 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar profile={profile} delayedCount={effectiveDelayedCount} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
