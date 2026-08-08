import {
  ACCEPTED_VIDEO_CONTENT_TYPES,
  CreateVideoRequestDto,
} from '@videogift/shared';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVideoDto implements CreateVideoRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsIn(ACCEPTED_VIDEO_CONTENT_TYPES)
  contentType!: string;
}
