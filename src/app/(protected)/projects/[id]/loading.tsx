export default function ProjectDetailLoading() {
  return (
    <div className="max-w-2xl space-y-6 animate-pulse">
      <div>
        <div className="h-3 w-20 bg-slate-100 rounded mb-4" />
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="h-6 w-64 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
          <div className="h-6 w-16 bg-slate-100 rounded" />
        </div>
        <div className="h-4 w-full bg-slate-100 rounded mt-3" />
        <div className="mt-3 max-w-xs h-2 bg-slate-100 rounded-full" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="h-5 w-28 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-9 bg-slate-100 rounded" />
          <div className="h-9 bg-slate-100 rounded" />
          <div className="h-16 bg-slate-100 rounded" />
        </div>
      </div>
      <div>
        <div className="h-5 w-20 bg-slate-200 rounded mb-3" />
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="h-4 w-32 bg-slate-100 rounded mb-2" />
          <div className="h-4 w-full bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  )
}
