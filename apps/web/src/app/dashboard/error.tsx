"use client";

export default function DashboardError({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 rounded-3xl border border-border bg-surface px-6 py-20 text-center">
      <p className="font-serif text-xl text-foreground">Não foi possível carregar seus vídeos</p>
      <p className="text-sm text-foreground/60">
        Algo deu errado ao falar com o servidor. Tente novamente.
      </p>
      <button
        onClick={retry}
        className="mt-2 rounded-full bg-accent px-5 py-2.5 font-medium text-accent-foreground transition hover:opacity-90"
      >
        Tentar de novo
      </button>
    </div>
  );
}
