import { Controller, Get, Param } from '@nestjs/common';
import type { PublicVideoDto } from '@videogift/shared';
import { VideosService } from './videos.service';

@Controller('public/videos')
export class PublicVideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get(':slug')
  getPublicVideo(@Param('slug') slug: string): Promise<PublicVideoDto> {
    return this.videosService.getPublicVideo(slug);
  }
}
