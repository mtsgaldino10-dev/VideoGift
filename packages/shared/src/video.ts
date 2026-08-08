export type VideoStatus = 'processing' | 'ready' | 'error';

export interface Video {
  id: string;
  slug: string;
  title: string | null;
  ownerId: string;
  r2ObjectKey: string;
  thumbnailUrl: string | null;
  status: VideoStatus;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoRequestDto {
  title?: string;
  contentType: string;
}

export interface CreateVideoResponseDto {
  id: string;
  slug: string;
  uploadUrl: string;
}

export interface VideoListItemDto {
  id: string;
  slug: string;
  title: string | null;
  thumbnailUrl: string | null;
  status: VideoStatus;
  createdAt: string;
}

export interface PublicVideoDto {
  slug: string;
  title: string | null;
  playbackUrl: string;
  thumbnailUrl: string | null;
}

export const ACCEPTED_VIDEO_CONTENT_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const;

export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;
