import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import ProgressBar from '@/components/ProgressBar'
import ProgressUpdateForm from '@/components/ProgressUpdateForm'
import EditProjectForm from '@/components/EditProjectForm'
import ProgressUpdateCard from '@/components/ProgressUpdateCard'
import { ChevronLeft } from 'lucide-react'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*, profiles(id, name, role)')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const { data: updates } = await supabase
    .from('progress_updates')
    .select('*, profiles(id, name, role), progress_update_history(id, edited_by, field_changes, created_at)')
    .eq('project_id', id)
    .order('week_date', { ascending: false })

  const { data: members } = await supabase
    .from('profiles')
    .select('id, name')
    .order('name')

  const isManager = profile.role === 'manager' || profile.role === 'admin'
  const isOwner = project.owner_id === user.id
  const canEdit = isManager || isOwner

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/projects"
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-4"
        >
          <ChevronLeft size={14} />
          返回專案列表
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
            {isManager && project.profiles && (
              <p className="text-sm text-slate-500 mt-0.5">負責人：{project.profiles.name}</p>
            )}
          </div>
          <StatusBadge status={project.status} />
        </div>

        {project.description && (
          <p className="text-sm text-slate-600 mt-2">{project.description}</p>
        )}

        <div className="mt-3 max-w-xs">
          <ProgressBar value={project.progress_percent} />
        </div>
      </div>

      {canEdit && <EditProjectForm project={project} />}

      {canEdit && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">新增進度更新</h2>
          <ProgressUpdateForm projectId={project.id} userId={user.id} />
        </div>
      )}

      <div>
        <h2 className="font-semibold text-slate-900 mb-3">進度記錄</h2>
        {updates && updates.length > 0 ? (
          <div className="space-y-3">
            {updates.map(update => (
              <ProgressUpdateCard
                key={update.id}
                update={update}
                canEdit={canEdit}
                members={members ?? []}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
            還沒有進度記錄
          </div>
        )}
      </div>
    </div>
  )
}
