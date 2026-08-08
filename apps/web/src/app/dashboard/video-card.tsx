"use client";

import type { VideoListItemDto, VideoStatus } from "@videogift/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { downloadQrCode, deleteVideo } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { QrCodeModal } from "./qr-code-modal";

const STATUS_LABEL: Record<VideoStatus, string> = {
  processing: "Processando",
  ready: "Pronto",
  error: "Erro",
};

const STATUS_CLASS: Record<VideoStatus, string> = {
  processing: "bg-secondary/20 text-secondary",
  ready: "bg-accent/15 text-accent",
  error: "bg-red-100 text-red-700",
};

async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export function VideoCard({ video }: { video: VideoListItemDto }) {
  const router = useRouter();
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoUrl = `${process.env.NEXT_PUBLIC_APP_URL}/v/${video.slug}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar o link.");
    }
  }

  async function handleDownload() {
    setError(null);
    const token = await getAccessToken();
    if (!token) return;

    try {
      await downloadQrCode(token, video.id, video.slug, "svg");
    } catch {
      setError("Não foi possível baixar o QR code.");
    }
  }

  async function handleDelete() {
    if (!confirm(`Remover o vídeo "${video.title ?? video.slug}"? Essa ação não pode ser desfeita.`)) {
      return;
    }

    setDeleting(true);
    setError(null);
    const token = await getAccessToken();
    if (!token) return;

    try {
      await deleteVideo(token, video.id);
      router.refresh();
    } catch {
      setError("Não foi possível remover o vídeo.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
      <div className="flex aspect-video items-center justify-center bg-background">
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={video.title ?? "Vídeo"}
            className="h-full w-full object-cover"
          />
        ) : (
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
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg text-foreground">
            {video.title ?? "Sem título"}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[video.status]}`}
          >
            {STATUS_LABEL[video.status]}
          </span>
        </div>

        <p className="text-xs text-foreground/60">
          {new Date(video.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>

        {error && <p className="text-xs text-accent">{error}</p>}

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setShowQr(true)}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-background"
          >
            Ver QR
          </button>
          <button
            onClick={handleDownload}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-background"
          >
            Baixar QR
          </button>
          <button
            onClick={handleCopyLink}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-background"
          >
            {copied ? "Copiado!" : "Copiar link"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-background disabled:opacity-60"
          >
            {deleting ? "Removendo..." : "Deletar"}
          </button>
        </div>
      </div>

      {showQr && (
        <QrCodeModal
          videoId={video.id}
          slug={video.slug}
          onClose={() => setShowQr(false)}
          getAccessToken={getAccessToken}
        />
      )}
    </div>
  );
}
