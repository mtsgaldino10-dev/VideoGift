import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const PRESIGNED_UPLOAD_EXPIRY_SECONDS = 15 * 60;

@Injectable()
export class R2Service {
  private readonly client: S3Client;
  private readonly bucketName: string;
  readonly publicUrl: string;

  constructor(configService: ConfigService) {
    this.bucketName = configService.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicUrl = configService.getOrThrow<string>('R2_PUBLIC_URL');
    this.client = new S3Client({
      region: 'auto',
      endpoint: configService.getOrThrow<string>('R2_ENDPOINT'),
      credentials: {
        accessKeyId: configService.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: configService.getOrThrow<string>(
          'R2_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async createUploadUrl(
    objectKey: string,
    contentType: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: PRESIGNED_UPLOAD_EXPIRY_SECONDS,
    });
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucketName, Key: objectKey }),
    );
  }

  getPublicUrl(objectKey: string): string {
    return `${this.publicUrl}/${objectKey}`;
  }
}
