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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-foreground">Seus vídeos</h1>
        <Link
          href="/dashboard/new"
          className="rounded-full bg-accent px-5 py-2.5 font-medium text-accent-foreground transition hover:opacity-90"
        >
          Novo vídeo
        </Link>
      </div>

      {videos.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-surface px-6 py-20 text-center">
      <svg
        width="56"
        height="56"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-secondary"
      >
        <rect x="3" y="5" width="14" height="14" rx="3" />
        <path d="m17 9 4-2v10l-4-2" />
      </svg>
      <div>
        <p className="font-serif text-xl text-foreground">Nenhum vídeo ainda</p>
        <p className="mt-1 text-sm text-foreground/70">
          Envie o primeiro vídeo e gere um QR code para colar numa caneca.
        </p>
      </div>
      <Link
        href="/dashboard/new"
        className="mt-2 rounded-full bg-accent px-5 py-2.5 font-medium text-accent-foreground transition hover:opacity-90"
      >
        Novo vídeo
      </Link>
    </div>
  );
}
