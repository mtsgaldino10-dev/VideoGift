import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type {
  CreateVideoResponseDto,
  VideoListItemDto,
} from '@videogift/shared';
import type { User } from '@supabase/supabase-js';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { QrCodeService } from '../qrcode/qrcode.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { GetQrCodeQueryDto } from './dto/get-qrcode-query.dto';
import { VideosService } from './videos.service';

@Controller('videos')
@UseGuards(SupabaseAuthGuard)
export class VideosController {
  constructor(
    private readonly videosService: VideosService,
    private readonly qrCodeService: QrCodeService,
  ) {}

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

  @Get(':id/qrcode')
  async getQrCode(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query() query: GetQrCodeQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const video = await this.videosService.findOwned(user.id, id);
    const url = this.qrCodeService.buildVideoUrl(video.slug);

    if (query.format === 'png') {
      const buffer = await this.qrCodeService.generatePng(url);
      res
        .setHeader('Content-Type', 'image/png')
        .setHeader(
          'Content-Disposition',
          `attachment; filename="qrmemoria-${video.slug}.png"`,
        )
        .send(buffer);
      return;
    }

    const svg = await this.qrCodeService.generateSvg(url);
    res
      .setHeader('Content-Type', 'image/svg+xml')
      .setHeader(
        'Content-Disposition',
        `attachment; filename="qrmemoria-${video.slug}.svg"`,
      )
      .send(svg);
  }
}
