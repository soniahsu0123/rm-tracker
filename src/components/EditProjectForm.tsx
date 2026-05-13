'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Project } from '@/types'
import { ChevronDown } from 'lucide-react'

export default function EditProjectForm({ project }: { project: Project }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progressValue, setProgressValue] = useState(project.progress_percent)

  useEffect(() => { setProgressValue(project.progress_percent) }, [project.progress_percent])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('projects')
      .update({
        name: formData.get('name') as string,
        description: (formData.get('description') as string) || null,
        status: formData.get('status') as string,
        progress_percent: progressValue,
        due_date: (formData.get('due_date') as string) || null,
      })
      .eq('id', project.id)

    if (updateError) {
      setError('更新失敗，請稍後再試')
      setLoading(false)
      return
    }

    const newStatus = formData.get('status') as string
    const action = newStatus !== project.status ? 'project.status_change' : 'project.update'
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        target_type: 'project',
        target_id: project.id,
        details: newStatus !== project.status
          ? { from: project.status, to: newStatus }
          : { name: formData.get('name') },
      }),
    })

    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ChevronDown size={14} />
        編輯專案資訊
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
      <h2 className="font-semibold text-slate-900">編輯專案</h2>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">專案名稱</label>
        <input
          name="name"
          required
          defaultValue={project.name}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">專案說明</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={project.description ?? ''}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">狀態</label>
          <select
            name="status"
            defaultValue={project.status}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="active">進行中</option>
            <option value="delayed">落後</option>
            <option value="paused">暫停</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
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
        <label className="block text-xs font-medium text-slate-700 mb-1">預計完成日</label>
        <input
          name="due_date"
          type="date"
          defaultValue={project.due_date ?? ''}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '儲存中...' : '儲存'}
        </button>
      </div>
    </form>
  )
}
