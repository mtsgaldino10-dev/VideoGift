import { Module } from '@nestjs/common';
import { PublicVideosController } from './public-videos.controller';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

@Module({
  controllers: [VideosController, PublicVideosController],
  providers: [VideosService],
})
export class VideosModule {}
