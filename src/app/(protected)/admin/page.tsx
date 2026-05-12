import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'manager' && profile.role !== 'admin')) redirect('/dashboard')

  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .order('role')
    .order('name')

  const { data: projectStats } = await supabase
    .from('projects')
    .select('owner_id, status')

  const countsByOwner = projectStats?.reduce(
    (acc, p) => {
      if (!acc[p.owner_id]) acc[p.owner_id] = { total: 0, active: 0, delayed: 0, completed: 0 }
      acc[p.owner_id].total++
      acc[p.owner_id][p.status as 'active' | 'delayed' | 'completed']++
      return acc
    },
    {} as Record<string, { total: number; active: number; delayed: number; completed: number }>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">成員管理</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          新增成員：前往{' '}
          <span className="font-medium text-indigo-600">
            Supabase Dashboard → Authentication → Users → Invite user
          </span>
          ，填寫 email，並在 User Metadata 加上{' '}
          <code className="bg-slate-100 px-1 rounded text-xs">
            {`{"name": "姓名", "role": "employee"}`}
          </code>
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {members?.map(member => {
          const counts = countsByOwner?.[member.id]
          return (
            <div key={member.id} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{member.name}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    member.role === 'manager'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {member.role === 'admin' ? '系統管理員' : member.role === 'manager' ? '主管' : '員工'}
                  </span>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                {counts ? (
                  <>
                    <span>共 {counts.total} 個專案</span>
                    {counts.delayed > 0 && (
                      <span className="text-red-600">{counts.delayed} 個落後</span>
                    )}
                    {counts.completed > 0 && (
                      <span className="text-green-600">{counts.completed} 個完成</span>
                    )}
                  </>
                ) : (
                  <span>尚無專案</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
