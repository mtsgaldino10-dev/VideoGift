import { IsIn, IsOptional } from 'class-validator';

export class GetQrCodeQueryDto {
  @IsOptional()
  @IsIn(['svg', 'png'])
  format: 'svg' | 'png' = 'svg';
}
