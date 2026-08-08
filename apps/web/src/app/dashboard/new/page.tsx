"use client";

import { ACCEPTED_VIDEO_CONTENT_TYPES, MAX_VIDEO_SIZE_BYTES } from "@videogift/shared";
import { ArrowLeft, Check, Download, Link2, UploadCloud, X } from "lucide-react";
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
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Painel
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Novo vídeo</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium text-slate-700">
            Título <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={stage === "uploading"}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Vídeo</span>

          {!file ? (
            <label
              htmlFor="file"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition ${
                dragging
                  ? "border-indigo-500 bg-indigo-50/50"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300"
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm shadow-slate-900/5">
                <UploadCloud size={20} strokeWidth={1.75} className="text-indigo-600" />
              </div>
              <p className="text-sm text-slate-700">
                Arraste o vídeo aqui ou{" "}
                <span className="font-medium text-indigo-600">selecione um arquivo</span>
              </p>
              <p className="text-xs text-slate-400">MP4, MOV ou WebM · até 100MB</p>
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
                  className="max-h-64 w-full rounded-xl bg-black"
                />
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="truncate text-slate-500">{file.name}</span>
                {stage === "form" && (
                  <button
                    type="button"
                    onClick={() => handleFile(null)}
                    className="flex shrink-0 items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
                  >
                    <X size={13} strokeWidth={2} />
                    Trocar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {stage === "uploading" && (
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">Enviando... {progress}%</p>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={stage === "uploading"}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-60"
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
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
        <Check size={22} strokeWidth={2.5} className="text-emerald-600" />
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Vídeo enviado!</h1>
        <p className="mt-1 text-sm text-slate-500">Seu QR code está pronto para ir pra gráfica.</p>
      </div>

      <div className="flex w-full flex-col items-center gap-5 rounded-xl border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5">
        <div className="flex h-52 w-52 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : svg ? (
            <div
              className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div className="h-full w-full animate-pulse rounded-lg bg-slate-200" />
          )}
        </div>

        <div className="flex w-full gap-2">
          <button
            onClick={() => handleDownload("svg")}
            disabled={downloading !== null}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <Download size={14} strokeWidth={2} />
            {downloading === "svg" ? "Baixando..." : "SVG"}
          </button>
          <button
            onClick={() => handleDownload("png")}
            disabled={downloading !== null}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <Download size={14} strokeWidth={2} />
            {downloading === "png" ? "Baixando..." : "PNG"}
          </button>
        </div>

        <button
          onClick={handleCopyLink}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-500"
        >
          {copied ? <Check size={15} strokeWidth={2} /> : <Link2 size={15} strokeWidth={2} />}
          {copied ? "Link copiado!" : "Copiar link"}
        </button>
      </div>

      <Link
        href="/dashboard"
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        Voltar ao painel
      </Link>
    </div>
  );
}
