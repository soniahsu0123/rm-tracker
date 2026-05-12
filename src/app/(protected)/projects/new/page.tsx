import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewProjectForm from './NewProjectForm'

export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'manager' || profile.role === 'admin') redirect('/projects')

  return <NewProjectForm />
}
