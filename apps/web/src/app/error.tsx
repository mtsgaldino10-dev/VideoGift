"use client";

export default function GlobalErrorBoundary({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-serif text-2xl text-foreground">Algo deu errado</p>
      <p className="text-sm text-foreground/60">
        Tivemos um problema inesperado. Tente novamente em instantes.
      </p>
      <button
        onClick={retry}
        className="mt-3 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90"
      >
        Tentar de novo
      </button>
    </div>
  );
}
