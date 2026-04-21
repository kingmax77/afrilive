import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  IsInt,
  Min,
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

  @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: 'uuid-of-product' })
  @IsOptional()
  @IsUUID()
  pinnedProductId?: string;
}

export class PinProductDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId: string;
}

export class UpdateStreamDto {
  @ApiPropertyOptional({ example: 42 })
  @IsOptional()
  @IsInt()
  @Min(0)
  viewerCount?: number;
}
