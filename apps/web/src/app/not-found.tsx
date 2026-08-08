import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-serif text-2xl text-foreground">Página não encontrada</p>
      <p className="text-sm text-foreground/60">O endereço que você acessou não existe.</p>
      <Link
        href="/dashboard"
        className="mt-3 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90"
      >
        Voltar ao painel
      </Link>
    </div>
  );
}
