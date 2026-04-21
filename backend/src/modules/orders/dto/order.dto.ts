import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'uuid-of-product' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'BXR-204-17', description: 'SmartAddress code for delivery' })
  @IsString()
  smartAddressCode: string;

  @ApiPropertyOptional({ example: 'uuid-of-stream' })
  @IsOptional()
  @IsUUID()
  streamId?: string;

  @ApiPropertyOptional({ example: 'KES' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'mpesa' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class RiderLocationDto {
  @ApiProperty({ example: -1.2921 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 36.8219 })
  @IsNumber()
  lng: number;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ example: 'James Otieno' })
  @IsOptional()
  @IsString()
  riderName?: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  @IsString()
  riderPhone?: string;

  @ApiPropertyOptional({ type: RiderLocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RiderLocationDto)
  riderLocation?: RiderLocationDto;
}
