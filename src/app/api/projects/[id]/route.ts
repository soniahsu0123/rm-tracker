import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canUser } from '@/lib/permissions'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('id, role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await canUser(profile, 'projects.delete'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Delete history entries for this project's updates
  const { data: updates } = await admin.from('progress_updates').select('id').eq('project_id', id)
  if (updates && updates.length > 0) {
    const updateIds = updates.map(u => u.id)
    await admin.from('progress_update_history').delete().in('update_id', updateIds)
  }

  // Delete progress updates (also covered by cascade, but explicit is safer)
  await admin.from('progress_updates').delete().eq('project_id', id)

  const { error: deleteError } = await admin.from('projects').delete().eq('id', id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'project.delete',
    target_type: 'project',
    target_id: id,
  })

  return NextResponse.json({ ok: true })
}
