export default function PlayerLoading() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[radial-gradient(ellipse_at_top,_#3d2b24,_#161010)] px-5">
      <div className="aspect-video w-full max-w-sm animate-pulse rounded-3xl bg-white/10" />
    </div>
  );
}
