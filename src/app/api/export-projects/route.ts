import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canUser } from '@/lib/permissions'
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const STATUS_LABELS: Record<string, string> = {
  active: '進行中',
  delayed: '落後',
  paused: '暫停',
  completed: '已完成',
  cancelled: '已取消',
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('id, role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await canUser(profile, 'projects.read_all'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const statusFilter = req.nextUrl.searchParams.get('status')

  const admin = createAdminClient()

  // Fetch projects with owner info
  let projectQuery = admin
    .from('projects')
    .select('*, profiles(name)')
    .order('updated_at', { ascending: false })
  if (statusFilter) projectQuery = projectQuery.eq('status', statusFilter)

  const { data: projects, error: projErr } = await projectQuery
  if (projErr) return NextResponse.json({ error: projErr.message }, { status: 500 })

  // Fetch all progress updates for these projects
  const projectIds = projects?.map(p => p.id) ?? []
  const { data: updates } = await admin
    .from('progress_updates')
    .select('*, profiles(name)')
    .in('project_id', projectIds)
    .order('week_date', { ascending: false })

  const today = new Date().toISOString().split('T')[0]

  // Sheet 1: 專案總覽
  const projectRows = (projects ?? []).map(p => {
    const isOverdue = p.due_date && p.due_date < today && (p.status === 'active' || p.status === 'delayed')
    const daysOverdue = isOverdue && p.due_date
      ? Math.floor((new Date(today).getTime() - new Date(p.due_date).getTime()) / 86400000)
      : null
    return {
      '專案名稱': p.name,
      '負責人': p.profiles?.name ?? '—',
      '狀態': STATUS_LABELS[p.status] ?? p.status,
      '進度 %': p.progress_percent,
      '截止日': p.due_date ?? '—',
      '已逾期天數': daysOverdue ?? '',
      '專案說明': p.description ?? '',
      '建立日期': new Date(p.created_at).toLocaleDateString('zh-TW'),
      '最後更新': new Date(p.updated_at).toLocaleDateString('zh-TW'),
    }
  })

  // Sheet 2: 進度更新明細
  const updateRows = (updates ?? []).map(u => {
    const project = projects?.find(p => p.id === u.project_id)
    return {
      '專案名稱': project?.name ?? '—',
      '負責人': project?.profiles?.name ?? '—',
      '週次日期': u.week_date,
      '進度 %': u.progress_percent ?? '',
      '進度說明': u.description,
      '問題 / 風險': u.issues ?? '',
      '下週計畫': u.next_steps ?? '',
      '回報人': u.profiles?.name ?? '—',
      '回報時間': new Date(u.created_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
    }
  })

  const wb = XLSX.utils.book_new()

  const ws1 = XLSX.utils.json_to_sheet(projectRows)
  ws1['!cols'] = [
    { wch: 24 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 12 },
    { wch: 10 }, { wch: 40 }, { wch: 12 }, { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, ws1, '專案總覽')

  const ws2 = XLSX.utils.json_to_sheet(updateRows)
  ws2['!cols'] = [
    { wch: 24 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 40 },
    { wch: 30 }, { wch: 30 }, { wch: 10 }, { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(wb, ws2, '進度更新明細')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer

  const filename = `rm-tracker-${today}.xlsx`

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
