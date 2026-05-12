import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('progress_updates')
    .select('*')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isManager = profile.role === 'manager' || profile.role === 'admin'
  if (!isManager && existing.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const fields = ['week_date', 'description', 'progress_percent', 'issues', 'next_steps'] as const

  const updates: Record<string, unknown> = {}
  const fieldChanges: { field: string; from: unknown; to: unknown }[] = []

  for (const field of fields) {
    if (field in body) {
      const newVal = body[field] === '' ? null : body[field]
      const oldVal = existing[field] ?? null
      if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
        updates[field] = newVal
        fieldChanges.push({ field, from: oldVal, to: newVal })
      }
    }
  }

  if (fieldChanges.length === 0) {
    return NextResponse.json({ ok: true, changed: false })
  }

  const admin = createAdminClient()
  const { error: updateError } = await admin
    .from('progress_updates')
    .update(updates)
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  await supabase.from('progress_update_history').insert({
    update_id: id,
    edited_by: user.id,
    field_changes: fieldChanges,
  })

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'progress.update',
    target_type: 'progress_update',
    target_id: id,
    details: { changes: fieldChanges.length },
  })

  if ('progress_percent' in updates && updates.progress_percent !== null) {
    await admin
      .from('projects')
      .update({ progress_percent: updates.progress_percent as number })
      .eq('id', existing.project_id)
  }

  return NextResponse.json({ ok: true, changed: true })
}
