import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import ProgressBar from '@/components/ProgressBar'
import { Profile, Project } from '@/types'
import { Plus } from 'lucide-react'
import { getEffectivePermissions } from '@/lib/permissions'

export default async function DashboardPage() {
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
  const perms = await getEffectivePermissions(profile)
  const canCreate = perms['projects.create']

  const { data: allProjects } = await supabase
    .from('projects')
    .select('*, profiles(id, name, role)')
    .order('updated_at', { ascending: false })

  const projects = isManager
    ? allProjects
    : allProjects?.filter(p => p.owner_id === user.id)

  const today = new Date().toISOString().split('T')[0]
  const total = projects?.length ?? 0
  const active = projects?.filter(p => p.status === 'active' && (!p.due_date || p.due_date >= today)).length ?? 0
  const delayed = projects?.filter(p => p.status === 'delayed' || (p.status === 'active' && p.due_date && p.due_date < today)).length ?? 0
  const completed = projects?.filter(p => p.status === 'completed').length ?? 0

  // Manager: group by team member
  let teamData: { profile: Profile; projects: Project[] }[] = []
  if (isManager && allProjects) {
    const map = new Map<string, { profile: Profile; projects: Project[] }>()
    allProjects.forEach(p => {
      if (p.profiles) {
        const existing = map.get(p.owner_id)
        if (existing) {
          existing.projects.push(p)
        } else {
          map.set(p.owner_id, { profile: p.profiles as Profile, projects: [p] })
        }
      }
    })
    teamData = Array.from(map.values())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {isManager ? '全部專案總覽' : `${profile.name} 的專案`}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isManager ? '監看所有成員的進度狀況' : '追蹤你負責的專案進度'}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} />
            新增專案
          </Link>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '全部', value: total, color: 'text-slate-900', href: '/projects' },
          { label: '進行中', value: active, color: 'text-blue-700', href: '/projects?status=active' },
          { label: '落後', value: delayed, color: 'text-red-700', href: '/projects?status=delayed' },
          { label: '已完成', value: completed, color: 'text-green-700', href: '/projects?status=completed' },
        ].map(({ label, value, color, href }) => (
          <Link key={label} href={href} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </Link>
        ))}
      </div>

      {isManager && teamData.length > 0 && (
        <div className="space-y-4">
          {teamData.map(({ profile: memberProfile, projects: memberProjects }) => (
            <div key={memberProfile.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">{memberProfile.name}</h2>
                <span className="text-xs text-slate-400">{memberProjects.length} 個專案</span>
              </div>
              <div className="space-y-2">
                {memberProjects.map(project => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-4 hover:bg-slate-50 rounded-lg p-2 -mx-2 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{project.name}</p>
                    </div>
                    <StatusBadge status={project.status} />
                    <div className="w-32">
                      <ProgressBar value={project.progress_percent} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isManager && teamData.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
          還沒有任何專案資料
        </div>
      )}

      {!isManager && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {projects && projects.length > 0 ? (
            projects.map(project => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{project.description}</p>
                  )}
                </div>
                <StatusBadge status={project.status} />
                <div className="w-32">
                  <ProgressBar value={project.progress_percent} />
                </div>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              還沒有專案，{' '}
              <Link href="/projects/new" className="text-indigo-600 hover:underline">
                新增第一個
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
