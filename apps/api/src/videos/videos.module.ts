import { Module } from '@nestjs/common';
import { QrCodeModule } from '../qrcode/qrcode.module';
import { PublicVideosController } from './public-videos.controller';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

@Module({
  imports: [QrCodeModule],
  controllers: [VideosController, PublicVideosController],
  providers: [VideosService],
})
export class VideosModule {}
