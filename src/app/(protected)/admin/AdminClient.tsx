'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Profile, Permission } from '@/types'

interface ActivityLog {
  id: string
  user_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

interface Props {
  members: Profile[]
  countsByOwner: Record<string, { total: number; active: number; delayed: number; completed: number }>
  currentUserId: string
  isAdmin: boolean
  isManager: boolean
  permissions: Permission[]
  logs: ActivityLog[]
}

const ROLE_LABEL: Record<string, string> = { admin: '系統管理員', manager: '主管', employee: '員工' }
const ROLE_STYLE: Record<string, string> = {
  admin: 'bg-violet-50 text-violet-700',
  manager: 'bg-indigo-50 text-indigo-700',
  employee: 'bg-slate-100 text-slate-600',
}

const LOG_ACTION_LABELS: Record<string, string> = {
  'project.create': '新增專案',
  'project.update': '修改專案',
  'project.status_change': '變更專案狀態',
  'progress.create': '新增進度更新',
  'admin.create_user': '新增成員',
  'admin.delete_user': '刪除成員',
  'admin.reset_password': '重設密碼',
  'admin.ban_user': '停用帳號',
  'admin.unban_user': '啟用帳號',
  'admin.permission_change': '修改權限',
}

const ACTION_LABELS: Record<string, string> = {
  'projects.read_all': '查看所有專案',
  'projects.create': '新增專案',
  'projects.update_own': '修改自己的專案',
  'projects.update_all': '修改所有人的專案',
  'projects.status_change': '變更專案狀態（暫停／取消）',
  'projects.delete': '永久刪除專案',
  'updates.create': '新增進度更新',
  'updates.update_own': '修改自己的進度更新',
  'updates.update_all': '修改所有人的進度更新',
  'updates.delete': '刪除進度更新',
}

const ACTION_ORDER = Object.keys(ACTION_LABELS)

export default function AdminClient({ members, countsByOwner, currentUserId, isAdmin, isManager, permissions: initialPermissions, logs }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'employee' | 'manager'>('employee')
  const [addError, setAddError] = useState('')
  const [tab, setTab] = useState<'members' | 'permissions' | 'logs'>('members')
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions)
  const [permLoading, setPermLoading] = useState<string | null>(null)

  async function resetPassword(userId: string) {
    if (!confirm('確定要將此帳號密碼重設為 123456 嗎？')) return
    setLoading(`reset-${userId}`)
    await fetch('/api/admin/reset-password', { method: 'POST', body: JSON.stringify({ userId }), headers: { 'Content-Type': 'application/json' } })
    setLoading(null)
    alert('密碼已重設為 123456')
  }

  async function toggleBan(userId: string, banned: boolean) {
    const msg = banned ? '確定要停用此帳號嗎？' : '確定要重新啟用此帳號嗎？'
    if (!confirm(msg)) return
    setLoading(`ban-${userId}`)
    await fetch('/api/admin/toggle-ban', { method: 'POST', body: JSON.stringify({ userId, banned }), headers: { 'Content-Type': 'application/json' } })
    setLoading(null)
    router.refresh()
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`確定要刪除「${name}」的帳號嗎？此操作無法復原。`)) return
    setLoading(`delete-${userId}`)
    await fetch('/api/admin/delete-user', { method: 'POST', body: JSON.stringify({ userId }), headers: { 'Content-Type': 'application/json' } })
    setLoading(null)
    router.refresh()
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    if (!newUsername.trim() || !newName.trim()) return
    setLoading('create')
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      body: JSON.stringify({ username: newUsername.trim(), name: newName.trim(), role: newRole }),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    setLoading(null)
    if (data.error) {
      setAddError(data.error.includes('already registered') ? '此帳號名稱已存在' : data.error)
    } else {
      setShowAddForm(false)
      setNewUsername('')
      setNewName('')
      setNewRole('employee')
      router.refresh()
    }
  }

  async function togglePermission(role: 'manager' | 'employee', action: string, allowed: boolean) {
    const key = `${role}.${action}`
    setPermLoading(key)
    const res = await fetch('/api/permissions', {
      method: 'PATCH',
      body: JSON.stringify({ role, action, allowed }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      setPermissions(prev =>
        prev.map(p => p.role === role && p.action === action ? { ...p, allowed } : p)
      )
    }
    setPermLoading(null)
  }

  function getPerm(role: 'manager' | 'employee', action: string) {
    return permissions.find(p => p.role === role && p.action === action)?.allowed ?? false
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">管理後台</h1>
        {isAdmin && tab === 'members' && (
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {showAddForm ? '取消' : '新增成員'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['members', 'permissions', 'logs'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'members' ? '成員管理' : t === 'permissions' ? '權限管理' : '操作日誌'}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {tab === 'members' && (
        <>
          {showAddForm && isAdmin && (
            <form onSubmit={createUser} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <p className="text-sm font-medium text-slate-700">新增成員</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">帳號名稱</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="例如 david"
                    required
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">顯示名稱</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="例如 David"
                    required
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">角色</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as 'employee' | 'manager')}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="employee">員工</option>
                    <option value="manager">主管</option>
                  </select>
                </div>
              </div>
              {addError && <p className="text-xs text-red-600">{addError}</p>}
              <p className="text-xs text-slate-400">預設密碼：123456，請通知本人登入後自行修改</p>
              <button
                type="submit"
                disabled={loading === 'create'}
                className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading === 'create' ? '建立中...' : '確認新增'}
              </button>
            </form>
          )}

          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {members.map(member => {
              const counts = countsByOwner[member.id]
              const isSelf = member.id === currentUserId
              return (
                <div key={member.id} className={`flex items-center gap-4 p-4 ${member.banned ? 'opacity-50' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{member.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${ROLE_STYLE[member.role] ?? ROLE_STYLE.employee}`}>
                        {ROLE_LABEL[member.role] ?? member.role}
                      </span>
                      {member.banned && <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600">已停用</span>}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 min-w-[80px] text-right">
                    {counts ? `共 ${counts.total} 個專案` : '尚無專案'}
                    {counts?.delayed ? <span className="text-red-600 ml-2">{counts.delayed} 落後</span> : null}
                  </div>
                  {isAdmin && !isSelf && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => resetPassword(member.id)}
                        disabled={!!loading}
                        className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                      >
                        重設密碼
                      </button>
                      <button
                        onClick={() => toggleBan(member.id, !member.banned)}
                        disabled={!!loading}
                        className={`text-xs px-2 py-1 rounded border transition-colors disabled:opacity-40 ${
                          member.banned
                            ? 'border-green-200 text-green-700 hover:bg-green-50'
                            : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                        }`}
                      >
                        {member.banned ? '啟用' : '停用'}
                      </button>
                      <button
                        onClick={() => deleteUser(member.id, member.name)}
                        disabled={!!loading}
                        className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                      >
                        刪除
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Permissions tab */}
      {tab === 'permissions' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-[1fr,80px,80px] text-xs font-medium text-slate-500 bg-slate-50 px-4 py-2.5 border-b border-slate-200">
            <span>功能</span>
            <span className="text-center">主管</span>
            <span className="text-center">員工</span>
          </div>
          {ACTION_ORDER.map(action => (
            <div key={action} className="grid grid-cols-[1fr,80px,80px] items-center px-4 py-3 border-b border-slate-100 last:border-0">
              <span className="text-sm text-slate-700">{ACTION_LABELS[action]}</span>
              {(['manager', 'employee'] as const).map(role => {
                const key = `${role}.${action}`
                const allowed = getPerm(role, action)
                const canEdit = isAdmin || (isManager && role === 'employee')
                return (
                  <div key={role} className="flex justify-center">
                    {canEdit ? (
                      <button
                        onClick={() => togglePermission(role, action, !allowed)}
                        disabled={permLoading === key}
                        className={`w-10 h-6 rounded-full transition-colors relative ${
                          allowed ? 'bg-indigo-600' : 'bg-slate-200'
                        } ${permLoading === key ? 'opacity-50' : ''}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          allowed ? 'left-5' : 'left-1'
                        }`} />
                      </button>
                    ) : (
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                        allowed ? 'text-indigo-600' : 'text-slate-300'
                      }`}>
                        {allowed ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200">
            <p className="text-xs text-slate-400">管理員擁有所有權限（無法修改）。主管可調整員工欄位；管理員可調整主管與員工欄位。</p>
          </div>
        </div>
      )}

      {/* Logs tab */}
      {tab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">尚無操作紀錄</div>
          ) : (
            logs.map(log => {
              const actorName = members.find(m => m.id === log.user_id)?.name ?? '系統'
              const actionLabel = LOG_ACTION_LABELS[log.action] ?? log.action
              const dt = new Date(log.created_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
              const detailStr = log.details
                ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' / ')
                : ''
              return (
                <div key={log.id} className="flex items-start gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{actorName}</span>
                      <span className="text-sm text-slate-600">{actionLabel}</span>
                      {detailStr && <span className="text-xs text-slate-400 truncate">{detailStr}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{dt}</span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
