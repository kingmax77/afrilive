import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEmail,
  IsOptional,
  IsNumber,
  IsPositive,
  IsNotEmpty,
} from 'class-validator';

export class InitializePaymentDto {
  @ApiProperty({ example: 'uuid-of-order', description: 'Order ID to pay for' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ example: 'amara@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    example: '+254700123456',
    description: 'Required for M-Pesa STK push',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'flutterwave',
    description: 'Payment provider: flutterwave | paystack | mpesa',
  })
  @IsOptional()
  @IsString()
  provider?: string;
}

export class FlutterwaveWebhookDto {
  @ApiProperty()
  event: string;

  @ApiProperty()
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    status: string;
    amount: number;
    currency: string;
    customer: { email: string; phone_number: string; name: string };
  };
}
