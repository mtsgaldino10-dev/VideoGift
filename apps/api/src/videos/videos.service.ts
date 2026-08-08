import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateVideoResponseDto,
  PublicVideoDto,
  VideoListItemDto,
} from '@videogift/shared';
import { R2Service } from '../storage/r2.service';
import { SupabaseService } from '../supabase/supabase.service';
import type { CreateVideoDto } from './dto/create-video.dto';
import { generateSlug } from './slug.util';
import type { VideoRow } from './video.repository.types';

const SLUG_INSERT_MAX_ATTEMPTS = 5;
const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class VideosService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly r2Service: R2Service,
  ) {}

  private get db() {
    return this.supabaseService.client;
  }

  async createVideo(
    ownerId: string,
    dto: CreateVideoDto,
  ): Promise<CreateVideoResponseDto> {
    for (let attempt = 0; attempt < SLUG_INSERT_MAX_ATTEMPTS; attempt++) {
      const slug = generateSlug();
      const r2ObjectKey = `videos/${slug}`;

      const { data, error } = await this.db
        .from('videos')
        .insert({
          slug,
          title: dto.title ?? null,
          owner_id: ownerId,
          r2_object_key: r2ObjectKey,
          status: 'processing',
        })
        .select('id, slug')
        .single();

      if (!error && data) {
        const uploadUrl = await this.r2Service.createUploadUrl(
          r2ObjectKey,
          dto.contentType,
        );
        return { id: data.id as string, slug: data.slug as string, uploadUrl };
      }

      if (error?.code !== POSTGRES_UNIQUE_VIOLATION) {
        throw new ConflictException(error?.message ?? 'Falha ao criar vídeo');
      }
    }

    throw new ConflictException(
      'Não foi possível gerar um slug único, tente novamente',
    );
  }

  async completeUpload(ownerId: string, videoId: string): Promise<void> {
    const { data, error } = await this.db
      .from('videos')
      .update({ status: 'ready' })
      .eq('id', videoId)
      .eq('owner_id', ownerId)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new ConflictException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Vídeo não encontrado');
    }
  }

  async listVideos(ownerId: string): Promise<VideoListItemDto[]> {
    const { data, error } = await this.db
      .from('videos')
      .select('id, slug, title, thumbnail_url, status, created_at')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ConflictException(error.message);
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string | null,
      thumbnailUrl: row.thumbnail_url as string | null,
      status: row.status as VideoListItemDto['status'],
      createdAt: row.created_at as string,
    }));
  }

  async deleteVideo(ownerId: string, videoId: string): Promise<void> {
    const video = await this.findOwned(ownerId, videoId);

    await this.r2Service.deleteObject(video.r2_object_key);

    const { error } = await this.db
      .from('videos')
      .delete()
      .eq('id', videoId)
      .eq('owner_id', ownerId);

    if (error) {
      throw new ConflictException(error.message);
    }
  }

  async findOwned(ownerId: string, videoId: string): Promise<VideoRow> {
    const { data, error } = await this.db
      .from('videos')
      .select(
        'id, slug, title, owner_id, r2_object_key, thumbnail_url, status, duration_seconds, file_size_bytes, created_at, updated_at',
      )
      .eq('id', videoId)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error) {
      throw new ConflictException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Vídeo não encontrado');
    }

    return data;
  }

  async getPublicVideo(slug: string): Promise<PublicVideoDto> {
    const { data, error } = await this.db
      .from('videos')
      .select('slug, title, thumbnail_url, r2_object_key, status')
      .eq('slug', slug)
      .eq('status', 'ready')
      .maybeSingle();

    if (error) {
      throw new ConflictException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Vídeo não encontrado');
    }

    return {
      slug: data.slug as string,
      title: data.title as string | null,
      thumbnailUrl: data.thumbnail_url as string | null,
      playbackUrl: this.r2Service.getPublicUrl(data.r2_object_key as string),
    };
  }
}
