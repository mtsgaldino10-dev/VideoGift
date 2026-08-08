export default function DashboardLoading() {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="aspect-video animate-pulse rounded-xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}
