"use client";

import { ACCEPTED_VIDEO_CONTENT_TYPES, MAX_VIDEO_SIZE_BYTES } from "@videogift/shared";
import Link from "next/link";
import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import {
  completeUpload,
  createVideo,
  downloadQrCode,
  fetchQrCodeSvg,
  uploadToR2,
} from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

type Stage = "form" | "uploading" | "success";

function validateFile(selected: File): string | null {
  if (!ACCEPTED_VIDEO_CONTENT_TYPES.includes(selected.type as never)) {
    return "Formato não suportado. Envie um vídeo em MP4, MOV ou WebM.";
  }
  if (selected.size > MAX_VIDEO_SIZE_BYTES) {
    return "O vídeo deve ter no máximo 100MB.";
  }
  return null;
}

export default function NewVideoPage() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("form");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ id: string; slug: string } | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFile(selected: File | null) {
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    const validationError = validateFile(selected);
    if (validationError) {
      setError(validationError);
      return;
    }
    setFile(selected);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Selecione um vídeo para continuar.");
      return;
    }

    setError(null);
    setStage("uploading");
    setProgress(0);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const { id, slug, uploadUrl } = await createVideo(session.access_token, {
        title: title || undefined,
        contentType: file.type,
      });

      await uploadToR2(uploadUrl, file, setProgress);
      await completeUpload(session.access_token, id);

      setResult({ id, slug });
      setStage("success");
    } catch {
      setError("Não foi possível enviar o vídeo. Tente novamente.");
      setStage("form");
    }
  }

  if (stage === "success" && result) {
    return <SuccessView videoId={result.id} slug={result.slug} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <h1 className="font-serif text-3xl text-foreground">Novo vídeo</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-8"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium text-foreground">
            Título (opcional)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={stage === "uploading"}
            className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-foreground outline-none focus:border-accent disabled:opacity-60"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Vídeo</span>

          {!file ? (
            <label
              htmlFor="file"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
                dragging ? "border-accent bg-accent/5" : "border-border bg-background"
              }`}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-secondary"
              >
                <path d="M12 16V4M12 4 7 9M12 4l5 5" />
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
              <p className="text-sm text-foreground">
                Arraste o vídeo aqui ou <span className="text-accent">selecione um arquivo</span>
              </p>
              <p className="text-xs text-foreground/50">MP4, MOV ou WebM · até 100MB</p>
              <input
                id="file"
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex flex-col gap-3">
              {previewUrl && (
                <video
                  src={previewUrl}
                  controls
                  className="max-h-64 w-full rounded-2xl bg-black"
                />
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="truncate text-foreground/70">{file.name}</span>
                {stage === "form" && (
                  <button
                    type="button"
                    onClick={() => handleFile(null)}
                    className="shrink-0 font-medium text-accent"
                  >
                    Trocar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {stage === "uploading" && (
          <div className="flex flex-col gap-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-foreground/60">Enviando... {progress}%</p>
          </div>
        )}

        {error && <p className="text-sm text-accent">{error}</p>}

        <button
          type="submit"
          disabled={stage === "uploading"}
          className="rounded-full bg-accent px-4 py-2.5 font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {stage === "uploading" ? "Enviando..." : "Enviar vídeo"}
        </button>
      </form>
    </div>
  );
}

function SuccessView({ videoId, slug }: { videoId: string; slug: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<"svg" | "png" | null>(null);
  const [copied, setCopied] = useState(false);

  const videoUrl = `${process.env.NEXT_PUBLIC_APP_URL}/v/${slug}`;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      try {
        const text = await fetchQrCodeSvg(session.access_token, videoId);
        if (!cancelled) setSvg(text);
      } catch {
        if (!cancelled) setError("Não foi possível carregar o QR code.");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  async function handleDownload(format: "svg" | "png") {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    setDownloading(format);
    try {
      await downloadQrCode(session.access_token, videoId, slug, format);
    } catch {
      setError("Não foi possível baixar o QR code.");
    } finally {
      setDownloading(null);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar o link.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 text-center">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Vídeo enviado!</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Seu QR code está pronto para ir pra gráfica.
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-5 rounded-3xl border border-border bg-surface p-8">
        <div className="flex h-56 w-56 items-center justify-center rounded-2xl bg-background p-4">
          {error ? (
            <p className="text-sm text-accent">{error}</p>
          ) : svg ? (
            <div
              className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <p className="text-sm text-foreground/60">Carregando...</p>
          )}
        </div>

        <div className="flex w-full gap-2">
          <button
            onClick={() => handleDownload("svg")}
            disabled={downloading !== null}
            className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background disabled:opacity-60"
          >
            {downloading === "svg" ? "Baixando..." : "Baixar SVG"}
          </button>
          <button
            onClick={() => handleDownload("png")}
            disabled={downloading !== null}
            className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background disabled:opacity-60"
          >
            {downloading === "png" ? "Baixando..." : "Baixar PNG"}
          </button>
        </div>

        <button
          onClick={handleCopyLink}
          className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90"
        >
          {copied ? "Link copiado!" : "Copiar link"}
        </button>
      </div>

      <Link href="/dashboard" className="text-sm font-medium text-foreground/60 hover:text-foreground">
        Voltar ao painel
      </Link>
    </div>
  );
}
