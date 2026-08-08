"use client";

import { useRef, useState } from "react";

export function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function handlePlay() {
    const video = videoRef.current;
    if (!video) return;
    void video.play();
    setPlaying(true);
  }

  return (
    <div className="relative flex max-h-[75dvh] w-full items-center justify-center overflow-hidden rounded-3xl bg-black shadow-2xl">
      <video
        ref={videoRef}
        src={src}
        playsInline
        controls={playing}
        preload="metadata"
        onEnded={() => setPlaying(false)}
        className="max-h-[75dvh] w-full object-contain"
      />

      {!playing && (
        <button
          onClick={handlePlay}
          aria-label="Reproduzir vídeo"
          className="absolute inset-0 flex items-center justify-center bg-black/10 transition hover:bg-black/20"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95 shadow-lg">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#3D2B24" className="translate-x-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
