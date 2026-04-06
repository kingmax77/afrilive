import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';

export class CreateAddressDto {
  @ApiPropertyOptional({ example: 'Home' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ example: -1.2921 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 36.8219 })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({ example: 'Opposite KFC Junction, Westlands' })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiPropertyOptional({ example: 'Blue' })
  @IsOptional()
  @IsString()
  gateColor?: string;

  @ApiPropertyOptional({ example: 'Ground' })
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional({ example: 'Call on arrival. Blue gate has intercom.' })
  @IsOptional()
  @IsString()
  arrivalInstructions?: string;

  @ApiPropertyOptional({ example: ['https://example.com/photo1.jpg'] })
  @IsOptional()
  @IsArray()
  photos?: string[];

  @ApiPropertyOptional({ example: 'Leave with guard if not home' })
  @IsOptional()
  @IsString()
  deliveryNotes?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
