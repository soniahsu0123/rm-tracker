import { Status } from '@/types'

const config: Record<Status, { label: string; className: string }> = {
  active: { label: '進行中', className: 'bg-blue-50 text-blue-700' },
  delayed: { label: '落後', className: 'bg-red-50 text-red-700' },
  completed: { label: '已完成', className: 'bg-green-50 text-green-700' },
}

export default function StatusBadge({ status }: { status: Status }) {
  const { label, className } = config[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
