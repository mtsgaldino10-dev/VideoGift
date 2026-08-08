export default function LoginLoading() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <div className="h-7 w-32 animate-pulse rounded-lg bg-background" />
        <div className="mt-3 h-4 w-48 animate-pulse rounded-lg bg-background" />
        <div className="mt-8 flex flex-col gap-4">
          <div className="h-11 w-full animate-pulse rounded-xl bg-background" />
          <div className="h-11 w-full animate-pulse rounded-xl bg-background" />
          <div className="mt-2 h-11 w-full animate-pulse rounded-full bg-background" />
        </div>
      </div>
    </main>
  );
}
