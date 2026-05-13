export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-32 bg-slate-200 rounded mb-2" />
          <div className="h-4 w-48 bg-slate-100 rounded" />
        </div>
        <div className="h-9 w-24 bg-slate-200 rounded-lg" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="h-3 w-12 bg-slate-100 rounded mb-2" />
            <div className="h-7 w-10 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <div className="h-4 w-48 bg-slate-200 rounded mb-1.5" />
              <div className="h-3 w-32 bg-slate-100 rounded" />
            </div>
            <div className="h-5 w-16 bg-slate-100 rounded" />
            <div className="w-32 h-2 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
