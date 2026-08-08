"use client";

import { AlertTriangle } from "lucide-react";

export default function DashboardError({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white px-6 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle size={20} strokeWidth={1.75} className="text-red-500" />
      </div>
      <div>
        <p className="text-base font-semibold text-slate-900">Não foi possível carregar seus vídeos</p>
        <p className="mt-1 text-sm text-slate-500">
          Algo deu errado ao falar com o servidor. Tente novamente.
        </p>
      </div>
      <button
        onClick={retry}
        className="mt-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-500"
      >
        Tentar de novo
      </button>
    </div>
  );
}
