import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsLatitude, IsLongitude } from 'class-validator';

export class AssignRiderDto {
  @ApiProperty({ example: 'uuid-of-order' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ example: 'uuid-of-rider' })
  @IsUUID()
  riderId: string;
}

export class UpdateLocationDto {
  @ApiProperty({ example: -1.2921 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 36.8219 })
  @IsNumber()
  lng: number;
}
