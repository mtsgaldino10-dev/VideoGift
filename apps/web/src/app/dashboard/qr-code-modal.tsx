"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { downloadQrCode, qrCodeUrl } from "@/lib/api";

interface QrCodeModalProps {
  videoId: string;
  slug: string;
  onClose: () => void;
  getAccessToken: () => Promise<string | null>;
}

export function QrCodeModal({ videoId, slug, onClose, getAccessToken }: QrCodeModalProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<"svg" | "png" | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      const token = await getAccessToken();
      if (!token) return;

      try {
        const res = await fetch(qrCodeUrl(videoId, "svg"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const text = await res.text();
        if (!cancelled) setSvg(text);
      } catch {
        if (!cancelled) setError("Não foi possível carregar o QR code.");
      }
    }

    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [videoId, getAccessToken]);

  async function handleDownload(format: "svg" | "png") {
    const token = await getAccessToken();
    if (!token) return;

    setDownloading(format);
    try {
      await downloadQrCode(token, videoId, slug, format);
    } catch {
      setError("Não foi possível baixar o QR code.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-xl shadow-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <h2 className="text-base font-semibold text-slate-900">QR code</h2>

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
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-60"
          >
            <Download size={14} strokeWidth={2} />
            {downloading === "png" ? "Baixando..." : "PNG"}
          </button>
        </div>
      </div>
    </div>
  );
}
