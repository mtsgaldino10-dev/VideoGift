"use client";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl bg-surface p-8 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-xl text-foreground">QR code</h2>

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
          onClick={onClose}
          className="text-sm font-medium text-foreground/60 hover:text-foreground"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
