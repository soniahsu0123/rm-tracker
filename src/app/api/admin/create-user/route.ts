import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { username, name, role } = await req.json()
  const email = `${username}@rmtracker.local`

  const admin = createAdminClient()
  const { data: newUser, error } = await admin.auth.admin.createUser({
    email,
    password: '123456',
    email_confirm: true,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('profiles').update({ name, role }).eq('id', newUser.user.id)
  await supabase.from('activity_logs').insert({ user_id: user.id, action: 'admin.create_user', target_type: 'user', target_id: newUser.user.id, details: { username, name, role } })

  return NextResponse.json({ success: true })
}
