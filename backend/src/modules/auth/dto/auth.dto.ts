import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsPhoneNumber, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export class SendOtpDto {
  @ApiProperty({ example: '+254700123456', description: 'Phone number in E.164 format' })
  @IsPhoneNumber()
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+254700123456' })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({ example: '483921', description: '6-digit OTP code' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class RegisterDto {
  @ApiProperty({ example: '+254700123456' })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({ example: 'Amara Osei' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: Role, example: Role.BUYER })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;
}
