import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import ProgressBar from '@/components/ProgressBar'
import ProgressUpdateForm from '@/components/ProgressUpdateForm'
import EditProjectForm from '@/components/EditProjectForm'
import ProgressUpdateCard from '@/components/ProgressUpdateCard'
import DeleteProjectButton from '@/components/DeleteProjectButton'
import { ChevronLeft } from 'lucide-react'
import { getEffectivePermissions } from '@/lib/permissions'

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
  const perms = await getEffectivePermissions(profile)

  const canEditProject = isOwner ? perms['projects.update_own'] : perms['projects.update_all']
  const canCreateUpdate = perms['updates.create'] && (isOwner || isManager)
  const canDeleteProject = perms['projects.delete']

  const today = new Date().toISOString().split('T')[0]
  const isOverdue = project.due_date && project.due_date < today && (project.status === 'active' || project.status === 'delayed')
  const daysOverdue = isOverdue && project.due_date
    ? Math.floor((new Date(today).getTime() - new Date(project.due_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0

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
            {project.due_date && (
              <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                截止日：{new Date(project.due_date).toLocaleDateString('zh-TW')}
                {isOverdue && ` · 已逾期 ${daysOverdue} 天`}
              </p>
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

      {canEditProject && <EditProjectForm project={project} />}

      {canCreateUpdate && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">新增進度更新</h2>
          <ProgressUpdateForm
            projectId={project.id}
            userId={user.id}
            projectProgress={project.progress_percent}
          />
        </div>
      )}

      <div>
        <h2 className="font-semibold text-slate-900 mb-3">進度記錄</h2>
        {updates && updates.length > 0 ? (
          <div className="space-y-3">
            {updates.map(update => {
              const isOwnUpdate = update.created_by === user.id
              const canEditUpdate = isOwnUpdate ? perms['updates.update_own'] : perms['updates.update_all']
              const canDeleteUpdate = perms['updates.delete']
              return (
                <ProgressUpdateCard
                  key={update.id}
                  update={update}
                  canEdit={canEditUpdate}
                  canDelete={canDeleteUpdate}
                  members={members ?? []}
                />
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
            還沒有進度記錄
          </div>
        )}
      </div>

      {canDeleteProject && (
        <div className="pt-4 border-t border-slate-200">
          <DeleteProjectButton projectId={project.id} projectName={project.name} />
        </div>
      )}
    </div>
  )
}
