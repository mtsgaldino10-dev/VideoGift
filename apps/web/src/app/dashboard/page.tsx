import { Plus, VideoOff } from "lucide-react";
import Link from "next/link";
import { listVideos } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { VideoCard } from "./video-card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const videos = session ? await listVideos(session.access_token) : [];

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Seus vídeos</h1>
          <p className="mt-1 text-sm text-slate-500">
            {videos.length === 0
              ? "Nenhum vídeo enviado ainda"
              : `${videos.length} vídeo${videos.length > 1 ? "s" : ""} enviado${videos.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-500 active:bg-indigo-700"
        >
          <Plus size={16} strokeWidth={2.5} />
          Novo vídeo
        </Link>
      </div>

      {videos.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <VideoOff size={22} strokeWidth={1.75} className="text-slate-400" />
      </div>
      <div>
        <p className="text-base font-semibold text-slate-900">Nenhum vídeo ainda</p>
        <p className="mt-1 text-sm text-slate-500">
          Envie o primeiro vídeo e gere um QR code para colar numa caneca.
        </p>
      </div>
      <Link
        href="/dashboard/new"
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-500"
      >
        <Plus size={16} strokeWidth={2.5} />
        Novo vídeo
      </Link>
    </div>
  );
}
