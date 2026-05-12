import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || (profile.role !== 'manager' && profile.role !== 'admin')) redirect('/dashboard')

  const { data: members } = await supabase.from('profiles').select('*').order('role').order('name')

  const { data: projectStats } = await supabase.from('projects').select('owner_id, status')
  const countsByOwner = projectStats?.reduce(
    (acc, p) => {
      if (!acc[p.owner_id]) acc[p.owner_id] = { total: 0, active: 0, delayed: 0, completed: 0 }
      acc[p.owner_id].total++
      acc[p.owner_id][p.status as 'active' | 'delayed' | 'completed']++
      return acc
    },
    {} as Record<string, { total: number; active: number; delayed: number; completed: number }>
  )

  return (
    <AdminClient
      members={members ?? []}
      countsByOwner={countsByOwner ?? {}}
      currentUserId={user.id}
      isAdmin={profile.role === 'admin'}
    />
  )
}
