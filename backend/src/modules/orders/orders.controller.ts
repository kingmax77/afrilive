import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create order from live-stream purchase' })
  create(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @Get('buyer')
  @ApiOperation({ summary: 'Get all orders for current buyer' })
  findForBuyer(@CurrentUser() user: any) {
    return this.ordersService.findForBuyer(user.id);
  }

  @Get('seller')
  @ApiOperation({ summary: 'Get all orders for current seller' })
  findForSeller(@CurrentUser() user: any) {
    return this.ordersService.findForSeller(user.id);
  }

  @Get('smartaddress/:code')
  @ApiOperation({
    summary:
      'Get all orders destined for a SmartAddress code — used by SmartAddress app to show incoming parcels',
  })
  @ApiParam({ name: 'code', example: 'BXR-204-17' })
  findBySmartAddress(@Param('code') code: string) {
    return this.ordersService.findBySmartAddress(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single order details' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.findOne(id, user.id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update order status (rider or seller only)' })
  updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(user.id, id, dto);
  }
}
