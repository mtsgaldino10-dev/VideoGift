"use client";

import { ACCEPTED_VIDEO_CONTENT_TYPES, MAX_VIDEO_SIZE_BYTES } from "@videogift/shared";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { completeUpload, createVideo } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

export default function NewVideoPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(selected: File | null) {
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }

    if (!ACCEPTED_VIDEO_CONTENT_TYPES.includes(selected.type as never)) {
      setError("Formato não suportado. Envie um vídeo em MP4, MOV ou WebM.");
      return;
    }

    if (selected.size > MAX_VIDEO_SIZE_BYTES) {
      setError("O vídeo deve ter no máximo 100MB.");
      return;
    }

    setFile(selected);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Selecione um vídeo para continuar.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const { id, uploadUrl } = await createVideo(session.access_token, {
        title: title || undefined,
        contentType: file.type,
      });

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Falha no upload");

      await completeUpload(session.access_token, id);

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Não foi possível enviar o vídeo. Tente novamente.");
      setSubmitting(false);
    }
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
            className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-foreground outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="file" className="text-sm font-medium text-foreground">
            Vídeo
          </label>
          <input
            id="file"
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            className="rounded-xl border border-dashed border-border bg-background px-3.5 py-2.5 text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-accent-foreground"
          />
          {file && <p className="text-xs text-foreground/60">{file.name}</p>}
        </div>

        {error && <p className="text-sm text-accent">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-accent px-4 py-2.5 font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Enviando..." : "Enviar vídeo"}
        </button>
      </form>
    </div>
  );
}
