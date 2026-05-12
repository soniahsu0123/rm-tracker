import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, banned } = await req.json()

  const { error } = await supabase
    .from('profiles')
    .update({ banned })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from('activity_logs').insert({ user_id: user.id, action: banned ? 'admin.ban_user' : 'admin.unban_user', target_type: 'user', target_id: userId })
  return NextResponse.json({ success: true })
}
