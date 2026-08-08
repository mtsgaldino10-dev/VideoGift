export default function NotFound() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-secondary"
      >
        <rect x="3" y="5" width="14" height="14" rx="3" />
        <path d="m17 9 4-2v10l-4-2" />
      </svg>
      <p className="font-serif text-xl text-foreground">Este vídeo não está mais disponível</p>
      <p className="text-sm text-foreground/60">
        O link pode ter expirado ou o vídeo foi removido.
      </p>
    </div>
  );
}
