import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';

const PNG_SIZE_PX = 1000;

@Injectable()
export class QrCodeService {
  private readonly appUrl: string;

  constructor(configService: ConfigService) {
    this.appUrl = configService
      .getOrThrow<string>('APP_URL')
      .replace(/\/+$/, '');
  }

  buildVideoUrl(slug: string): string {
    return `${this.appUrl}/v/${slug}`;
  }

  generateSvg(url: string): Promise<string> {
    return QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
    });
  }

  generatePng(url: string): Promise<Buffer> {
    return QRCode.toBuffer(url, {
      type: 'png',
      errorCorrectionLevel: 'H',
      margin: 2,
      width: PNG_SIZE_PX,
    });
  }
}
