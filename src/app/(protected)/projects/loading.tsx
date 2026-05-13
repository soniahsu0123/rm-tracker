export default function ProjectsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-24 bg-slate-200 rounded" />
        <div className="h-9 w-24 bg-slate-200 rounded-lg" />
      </div>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-7 w-14 bg-slate-100 rounded-lg" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <div className="h-4 w-56 bg-slate-200 rounded mb-1.5" />
              <div className="h-3 w-40 bg-slate-100 rounded" />
            </div>
            <div className="h-5 w-16 bg-slate-100 rounded" />
            <div className="w-36 h-2 bg-slate-100 rounded-full" />
            <div className="w-20 h-3 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
