export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-surface" />
        <div className="h-11 w-32 animate-pulse rounded-full bg-surface" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="aspect-video animate-pulse rounded-3xl border border-border bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
