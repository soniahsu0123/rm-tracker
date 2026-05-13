export default function AdminLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-24 bg-slate-200 rounded" />
        <div className="h-9 w-24 bg-slate-200 rounded-lg" />
      </div>
      <div className="flex gap-1 border-b border-slate-200">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-9 w-20 bg-slate-100 rounded-t" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <div className="h-4 w-32 bg-slate-200 rounded mb-1.5" />
              <div className="h-3 w-20 bg-slate-100 rounded" />
            </div>
            <div className="h-3 w-20 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
