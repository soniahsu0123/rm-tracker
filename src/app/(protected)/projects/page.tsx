import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import ProgressBar from '@/components/ProgressBar'
import { Plus } from 'lucide-react'
import { Status } from '@/types'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const isManager = profile.role === 'manager' || profile.role === 'admin'
  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('projects')
    .select('*, profiles(id, name, role)')
    .order('updated_at', { ascending: false })

  if (!isManager) {
    query = query.eq('owner_id', user.id)
  }
  if (params.status) {
    query = query.eq('status', params.status as Status)
  }

  const { data: projects } = await query

  const statuses = [
    { value: '', label: '全部' },
    { value: 'active', label: '進行中' },
    { value: 'delayed', label: '落後' },
    { value: 'completed', label: '已完成' },
    { value: 'paused', label: '暫停' },
    { value: 'cancelled', label: '取消' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">
          {isManager ? '所有專案' : '我的專案'}
        </h1>
        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={15} />
          新增專案
        </Link>
      </div>

      <div className="flex gap-1 flex-wrap">
        {statuses.map(({ value, label }) => (
          <Link
            key={value || 'all'}
            href={value ? `/projects?status=${value}` : '/projects'}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              (params.status ?? '') === value
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {projects && projects.length > 0 ? (
          projects.map(project => {
            const isOverdue = project.due_date && project.due_date < today && project.status === 'active'
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{project.name}</p>
                  {isManager && project.profiles && (
                    <p className="text-xs text-slate-400 mt-0.5">{project.profiles.name}</p>
                  )}
                  {project.description && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{project.description}</p>
                  )}
                </div>
                <StatusBadge status={project.status} />
                <div className="w-36">
                  <ProgressBar value={project.progress_percent} />
                </div>
                <p className={`text-xs w-20 text-right ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                  {project.due_date
                    ? new Date(project.due_date).toLocaleDateString('zh-TW')
                    : '—'}
                </p>
              </Link>
            )
          })
        ) : (
          <div className="p-8 text-center text-slate-400 text-sm">
            沒有符合條件的專案
          </div>
        )}
      </div>
    </div>
  )
}
