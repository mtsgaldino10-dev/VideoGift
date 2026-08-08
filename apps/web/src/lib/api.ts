import type {
  CreateVideoRequestDto,
  CreateVideoResponseDto,
  VideoListItemDto,
} from "@videogift/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { message?: string });
    throw new ApiError(res.status, body.message ?? "Erro ao comunicar com o servidor");
  }

  if (!res.headers.get("content-type")?.includes("application/json")) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export function listVideos(accessToken: string): Promise<VideoListItemDto[]> {
  return request<VideoListItemDto[]>("/videos", accessToken);
}

export function deleteVideo(accessToken: string, id: string): Promise<void> {
  return request<void>(`/videos/${id}`, accessToken, { method: "DELETE" });
}

export function createVideo(
  accessToken: string,
  dto: CreateVideoRequestDto,
): Promise<CreateVideoResponseDto> {
  return request<CreateVideoResponseDto>("/videos", accessToken, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function completeUpload(accessToken: string, id: string): Promise<void> {
  return request<void>(`/videos/${id}/complete`, accessToken, { method: "POST" });
}

export function uploadToR2(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error("Falha no upload do vídeo"));
      }
    };
    xhr.onerror = () => reject(new Error("Falha no upload do vídeo"));

    xhr.send(file);
  });
}

export async function fetchQrCodeSvg(accessToken: string, id: string): Promise<string> {
  const res = await fetch(qrCodeUrl(id, "svg"), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new ApiError(res.status, "Não foi possível gerar o QR code");
  }
  return res.text();
}

export function qrCodeUrl(id: string, format: "svg" | "png" = "svg"): string {
  return `${API_URL}/videos/${id}/qrcode?format=${format}`;
}

export async function downloadQrCode(
  accessToken: string,
  id: string,
  slug: string,
  format: "svg" | "png",
): Promise<void> {
  const res = await fetch(qrCodeUrl(id, format), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new ApiError(res.status, "Não foi possível gerar o QR code");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `qrmemoria-${slug}.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}
