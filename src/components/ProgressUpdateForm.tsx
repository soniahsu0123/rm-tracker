'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  projectId: string
  userId: string
}

export default function ProgressUpdateForm({ projectId, userId }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const progressPercent = formData.get('progress_percent') as string

    const { error: insertError } = await supabase.from('progress_updates').insert({
      project_id: projectId,
      created_by: userId,
      week_date: formData.get('week_date') as string,
      description: formData.get('description') as string,
      progress_percent: progressPercent ? parseInt(progressPercent) : null,
      issues: (formData.get('issues') as string) || null,
      next_steps: (formData.get('next_steps') as string) || null,
    })

    if (insertError) {
      setError('新增失敗，請稍後再試')
      setLoading(false)
      return
    }

    if (progressPercent) {
      await supabase
        .from('projects')
        .update({ progress_percent: parseInt(progressPercent) })
        .eq('id', projectId)
    }

    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'progress.create',
        target_type: 'project',
        target_id: projectId,
        details: progressPercent ? { progress_percent: parseInt(progressPercent) } : undefined,
      }),
    })

    formRef.current?.reset()
    setLoading(false)
    router.refresh()
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            週次日期 <span className="text-red-500">*</span>
          </label>
          <input
            name="week_date"
            type="date"
            required
            defaultValue={today}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            進度更新 %
          </label>
          <input
            name="progress_percent"
            type="number"
            min="0"
            max="100"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="選填"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          本週進度說明 <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          required
          rows={2}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="本週完成了什麼、目前進度到哪裡"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          問題 / 風險
        </label>
        <textarea
          name="issues"
          rows={2}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="遇到什麼困難或需要協助的地方（選填）"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          下週計畫
        </label>
        <textarea
          name="next_steps"
          rows={2}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="下週預計完成的事項（選填）"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '送出中...' : '送出進度更新'}
      </button>
    </form>
  )
}
