import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, target_type, target_id, details } = await req.json()
  if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 })

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action,
    target_type: target_type ?? null,
    target_id: target_id ?? null,
    details: details ?? null,
  })

  return NextResponse.json({ ok: true })
}
