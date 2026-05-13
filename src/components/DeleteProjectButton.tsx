'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface Props {
  projectId: string
  projectName: string
}

export default function DeleteProjectButton({ projectId, projectName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/projects')
      router.refresh()
    } else {
      alert('刪除失敗，請稍後再試')
      setConfirmDelete(false)
      setLoading(false)
    }
  }

  if (!confirmDelete) {
    return (
      <button
        onClick={() => setConfirmDelete(true)}
        className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition-colors"
      >
        <Trash2 size={14} />
        刪除此專案
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
      <p className="text-sm text-red-700 flex-1">
        確定刪除「{projectName}」？所有進度記錄也會一併刪除，無法復原。
      </p>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading ? '刪除中...' : '確定刪除'}
      </button>
      <button
        onClick={() => setConfirmDelete(false)}
        className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        取消
      </button>
    </div>
  )
}
