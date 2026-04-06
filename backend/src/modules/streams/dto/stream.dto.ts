import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';

export class CreateStreamDto {
  @ApiProperty({ example: 'Sunday Fashion Drop 🎉 New Ankara styles!' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Fashion' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: '2026-04-10T18:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}

export class PinProductDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId: string;
}
