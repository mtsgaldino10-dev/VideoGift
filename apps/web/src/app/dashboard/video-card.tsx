"use client";

import type { VideoListItemDto, VideoStatus } from "@videogift/shared";
import { Check, Download, Link2, QrCode, Trash2, Video } from "lucide-react";
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

const STATUS_DOT: Record<VideoStatus, string> = {
  processing: "bg-amber-500",
  ready: "bg-emerald-500",
  error: "bg-red-500",
};

const STATUS_CLASS: Record<VideoStatus, string> = {
  processing: "bg-amber-50 text-amber-700",
  ready: "bg-emerald-50 text-emerald-700",
  error: "bg-red-50 text-red-700",
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
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md hover:shadow-slate-900/5">
      <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={video.title ?? "Vídeo"}
            className="h-full w-full object-cover"
          />
        ) : (
          <Video size={30} strokeWidth={1.5} className="text-slate-300" />
        )}

        <span
          className={`absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium ${STATUS_CLASS[video.status]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[video.status]}`} />
          {STATUS_LABEL[video.status]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="truncate text-sm font-semibold text-slate-900">
          {video.title ?? "Sem título"}
        </h3>
        <p className="text-xs text-slate-400">
          {new Date(video.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>

        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

        <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3">
          <ActionButton label="Ver QR" onClick={() => setShowQr(true)}>
            <QrCode size={15} strokeWidth={1.75} />
          </ActionButton>
          <ActionButton label="Baixar QR" onClick={handleDownload}>
            <Download size={15} strokeWidth={1.75} />
          </ActionButton>
          <ActionButton label={copied ? "Copiado!" : "Copiar link"} onClick={handleCopyLink}>
            {copied ? (
              <Check size={15} strokeWidth={2} className="text-emerald-600" />
            ) : (
              <Link2 size={15} strokeWidth={1.75} />
            )}
          </ActionButton>
          <ActionButton
            label="Deletar"
            onClick={handleDelete}
            disabled={deleting}
            danger
            className="ml-auto"
          >
            <Trash2 size={15} strokeWidth={1.75} />
          </ActionButton>
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

function ActionButton({
  label,
  onClick,
  disabled,
  danger,
  className = "",
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition disabled:opacity-50 ${
        danger
          ? "hover:bg-red-50 hover:text-red-600"
          : "hover:bg-slate-100 hover:text-slate-900"
      } ${className}`}
    >
      {children}
    </button>
  );
}
