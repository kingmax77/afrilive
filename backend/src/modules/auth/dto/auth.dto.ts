import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn, IsOptional, Matches } from 'class-validator';

export const VALID_ROLES = ['BUYER', 'SELLER', 'RIDER', 'RESIDENT'] as const;
export type RoleType = (typeof VALID_ROLES)[number];

export class SendOtpDto {
  @ApiProperty({ example: '+254700123456', description: 'Phone number starting with + followed by 7-15 digits' })
  @Matches(/^\+\d{7,15}$/, { message: 'phone must start with + followed by 7–15 digits (e.g. +254700123456)' })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+254700123456' })
  @Matches(/^\+\d{7,15}$/, { message: 'phone must start with + followed by 7–15 digits (e.g. +254700123456)' })
  phone: string;

  @ApiProperty({ example: '483921', description: '6-digit OTP code' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class RegisterDto {
  @ApiProperty({ example: '+254700123456' })
  @Matches(/^\+\d{7,15}$/, { message: 'phone must start with + followed by 7–15 digits (e.g. +254700123456)' })
  phone: string;

  @ApiProperty({ example: 'Amara Osei' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: VALID_ROLES, example: 'BUYER' })
  @IsIn(VALID_ROLES)
  role: RoleType;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class AddRoleDto {
  @ApiProperty({ enum: VALID_ROLES, example: 'SELLER' })
  @IsIn(VALID_ROLES)
  role: RoleType;
}
