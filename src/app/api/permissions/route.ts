import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('permissions').select('*').order('role').order('action')
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { role, action, allowed } = await req.json()

  // Manager can only change employee permissions
  if (profile.role === 'manager' && role !== 'employee') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('permissions')
    .update({ allowed })
    .eq('role', role)
    .eq('action', action)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from('activity_logs').insert({ user_id: user.id, action: 'admin.permission_change', details: { role, action, allowed } })
  return NextResponse.json({ success: true })
}
