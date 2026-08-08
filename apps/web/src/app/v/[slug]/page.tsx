import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicVideo } from "@/lib/api";
import { VideoPlayer } from "./video-player";

export async function generateMetadata({
  params,
}: PageProps<"/v/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const video = await getPublicVideo(slug);

  if (!video) {
    return { title: "Vídeo não encontrado — VideoGift" };
  }

  const title = "Você recebeu uma mensagem especial 💌";
  const description = video.title ?? "Assista a essa lembrança em vídeo.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: video.thumbnailUrl ? [video.thumbnailUrl] : undefined,
    },
  };
}

export default async function PublicVideoPage({ params }: PageProps<"/v/[slug]">) {
  const { slug } = await params;
  const video = await getPublicVideo(slug);

  if (!video) {
    notFound();
  }

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_#3d2b24,_#161010)]">
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-6 px-5 py-10">
        <div className="w-full max-w-sm">
          <VideoPlayer src={video.playbackUrl} />
        </div>
        <footer className="text-xs text-white/50">Feito com VideoGift</footer>
      </div>
    </div>
  );
}
