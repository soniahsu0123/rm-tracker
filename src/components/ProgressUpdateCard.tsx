'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'

interface HistoryEntry {
  id: string
  edited_by: string | null
  field_changes: { field: string; from: unknown; to: unknown }[]
  created_at: string
}

interface Update {
  id: string
  week_date: string
  description: string
  progress_percent: number | null
  issues: string | null
  next_steps: string | null
  progress_update_history?: HistoryEntry[]
}

interface Member {
  id: string
  name: string
}

interface Props {
  update: Update
  canEdit: boolean
  canDelete?: boolean
  members: Member[]
}

const FIELD_LABELS: Record<string, string> = {
  week_date: '週次日期',
  description: '進度說明',
  progress_percent: '進度 %',
  issues: '問題',
  next_steps: '下週計畫',
}

export default function ProgressUpdateCard({ update, canEdit, canDelete = canEdit, members }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progressValue, setProgressValue] = useState(update.progress_percent ?? 0)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const history = update.progress_update_history ?? []

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const body: Record<string, unknown> = {
      week_date: formData.get('week_date') as string,
      description: formData.get('description') as string,
      progress_percent: progressValue,
      issues: (formData.get('issues') as string) || null,
      next_steps: (formData.get('next_steps') as string) || null,
    }

    const res = await fetch(`/api/progress-updates/${update.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      setError('更新失敗，請稍後再試')
      setLoading(false)
      return
    }

    setEditing(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/progress-updates/${update.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      setError('刪除失敗，請稍後再試')
      setConfirmDelete(false)
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">週次日期</label>
              <input
                name="week_date"
                type="date"
                required
                defaultValue={update.week_date}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                進度 % <span className="text-indigo-600 font-semibold">{progressValue}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={progressValue}
                onChange={e => setProgressValue(parseInt(e.target.value))}
                className="w-full mt-2 accent-indigo-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">本週進度說明 <span className="text-red-500">*</span></label>
            <textarea
              name="description"
              required
              rows={2}
              defaultValue={update.description}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">問題 / 風險</label>
            <textarea
              name="issues"
              rows={2}
              defaultValue={update.issues ?? ''}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">下週計畫</label>
            <textarea
              name="next_steps"
              rows={2}
              defaultValue={update.next_steps ?? ''}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '儲存中...' : '儲存修改'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              {new Date(update.week_date).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <div className="flex items-center gap-2">
              {update.progress_percent !== null && (
                <span className="text-xs text-indigo-600 font-medium">
                  {update.progress_percent}%
                </span>
              )}
              {!confirmDelete && (canEdit || canDelete) && (
                <>
                  {canEdit && (
                    <button
                      onClick={() => setEditing(true)}
                      disabled={loading}
                      className="text-slate-300 hover:text-slate-500 transition-colors disabled:opacity-40"
                      title="修改"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      disabled={loading}
                      className="text-slate-300 hover:text-red-400 transition-colors disabled:opacity-40"
                      title="刪除"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </>
              )}
              {canDelete && confirmDelete && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-red-500">確定刪除？</span>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="text-xs text-red-600 font-medium hover:underline disabled:opacity-40"
                  >
                    {loading ? '...' : '刪除'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-slate-400 hover:underline"
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
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

          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

          {history.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowHistory(v => !v)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                已修改 {history.length} 次
              </button>
              {showHistory && (
                <div className="mt-2 space-y-2">
                  {history.map(h => {
                    const editor = members.find(m => m.id === h.edited_by)?.name ?? '系統'
                    const dt = new Date(h.created_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
                    return (
                      <div key={h.id} className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-700">{editor} 修改了</span>
                          <span>{dt}</span>
                        </div>
                        <ul className="space-y-0.5">
                          {h.field_changes.map((c, i) => (
                            <li key={i}>
                              <span className="text-slate-400">{FIELD_LABELS[c.field] ?? c.field}：</span>
                              <span className="line-through text-slate-400">{String(c.from ?? '（空）')}</span>
                              {' → '}
                              <span className="text-slate-600">{String(c.to ?? '（空）')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
