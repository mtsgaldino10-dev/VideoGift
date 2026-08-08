import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type {
  CreateVideoResponseDto,
  VideoListItemDto,
} from '@videogift/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { User } from '@supabase/supabase-js';
import { CreateVideoDto } from './dto/create-video.dto';
import { VideosService } from './videos.service';

@Controller('videos')
@UseGuards(SupabaseAuthGuard)
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  createVideo(
    @CurrentUser() user: User,
    @Body() dto: CreateVideoDto,
  ): Promise<CreateVideoResponseDto> {
    return this.videosService.createVideo(user.id, dto);
  }

  @Post(':id/complete')
  completeUpload(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    return this.videosService.completeUpload(user.id, id);
  }

  @Get()
  listVideos(@CurrentUser() user: User): Promise<VideoListItemDto[]> {
    return this.videosService.listVideos(user.id);
  }

  @Delete(':id')
  deleteVideo(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    return this.videosService.deleteVideo(user.id, id);
  }
}
