import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { AssignRiderDto, UpdateLocationDto } from './dto/delivery.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('assign')
  @ApiOperation({ summary: 'Assign a rider to an order' })
  assign(@Body() dto: AssignRiderDto) {
    return this.deliveryService.assign(dto);
  }

  @Put(':orderId/location')
  @ApiOperation({ summary: 'Rider updates their current GPS location' })
  updateLocation(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.deliveryService.updateLocation(user.id, orderId, dto);
  }

  @Get(':orderId/track')
  @ApiOperation({ summary: 'Get real-time rider location for tracking map' })
  track(@Param('orderId') orderId: string) {
    return this.deliveryService.track(orderId);
  }

  @Put(':orderId/delivered')
  @ApiOperation({ summary: 'Rider marks order as delivered, releases payment to seller' })
  markDelivered(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.deliveryService.markDelivered(user.id, orderId);
  }
}
