import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  let projectQuery = supabase
    .from('projects')
    .select('id, status, due_date, owner_id')
    .eq('status', 'active')
    .lt('due_date', today)

  if (!isManager) projectQuery = projectQuery.eq('owner_id', user.id)

  const { data: overdueProjects } = await projectQuery
  const delayedCount = overdueProjects?.length ?? 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar profile={profile} delayedCount={delayedCount} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
