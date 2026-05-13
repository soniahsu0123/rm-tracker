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

  // Sync overdue active projects → delayed (status accuracy)
  let overdueQ = supabase.from('projects').select('id').eq('status', 'active').lt('due_date', today)
  if (!isManager) overdueQ = overdueQ.eq('owner_id', user.id)
  const { data: overdueProjects } = await overdueQ

  // Fire-and-forget write (does not block render)
  if (overdueProjects && overdueProjects.length > 0) {
    const ids = overdueProjects.map(p => p.id)
    createAdminClient().from('projects').update({ status: 'delayed' }).in('id', ids).then(() => {})
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar profile={profile} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
