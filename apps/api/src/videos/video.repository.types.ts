import type { VideoStatus } from '@videogift/shared';

export interface VideoRow {
  id: string;
  slug: string;
  title: string | null;
  owner_id: string;
  r2_object_key: string;
  thumbnail_url: string | null;
  status: VideoStatus;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  created_at: string;
  updated_at: string;
}
