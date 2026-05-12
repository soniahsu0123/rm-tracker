export default function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right">{value}%</span>
    </div>
  )
}
