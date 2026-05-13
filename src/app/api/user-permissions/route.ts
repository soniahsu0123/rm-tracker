import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/user-permissions?user_id=xxx  — returns all overrides for a user
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const targetUserId = req.nextUrl.searchParams.get('user_id')
  if (!targetUserId) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('user_permissions')
    .select('action, allowed')
    .eq('user_id', targetUserId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// PATCH /api/user-permissions  — upsert a single override
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { target_user_id, action, allowed } = await req.json()

  // Managers can only edit employee permissions
  if (profile.role === 'manager') {
    const { data: targetProfile } = await supabase.from('profiles').select('role').eq('id', target_user_id).single()
    if (!targetProfile || targetProfile.role !== 'employee') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('user_permissions')
    .upsert({ user_id: target_user_id, action, allowed }, { onConflict: 'user_id,action' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'admin.permission_change',
    details: { target_user_id, action, allowed, level: 'user' },
  })

  return NextResponse.json({ success: true })
}

// DELETE /api/user-permissions  — remove an override (revert to role default)
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { target_user_id, action } = await req.json()

  const admin = createAdminClient()
  const { error } = await admin
    .from('user_permissions')
    .delete()
    .eq('user_id', target_user_id)
    .eq('action', action)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
