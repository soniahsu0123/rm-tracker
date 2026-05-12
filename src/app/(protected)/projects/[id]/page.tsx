import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import ProgressBar from '@/components/ProgressBar'
import ProgressUpdateForm from '@/components/ProgressUpdateForm'
import EditProjectForm from '@/components/EditProjectForm'
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
    .select('*, profiles(id, name, role)')
    .eq('project_id', id)
    .order('week_date', { ascending: false })

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
              <div key={update.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500">
                    {new Date(update.week_date).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  {update.progress_percent !== null && (
                    <span className="text-xs text-indigo-600 font-medium">
                      {update.progress_percent}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-900">{update.description}</p>
                {update.issues && (
                  <div className="mt-2 p-2 bg-red-50 rounded-lg">
                    <p className="text-xs font-medium text-red-700 mb-0.5">問題</p>
                    <p className="text-xs text-red-600">{update.issues}</p>
                  </div>
                )}
                {update.next_steps && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-blue-700 mb-0.5">下週計畫</p>
                    <p className="text-xs text-blue-600">{update.next_steps}</p>
                  </div>
                )}
              </div>
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
