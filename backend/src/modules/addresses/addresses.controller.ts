import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all SmartAddresses for current user' })
  findAll(@CurrentUser() user: any) {
    return this.addressesService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new SmartAddress (auto-generates code)' })
  create(@CurrentUser() user: any, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(user.id, dto);
  }

  @Get(':code/confidence')
  @ApiOperation({ summary: 'Get confidence score breakdown for an address code' })
  @ApiParam({ name: 'code', example: 'BXR-204-17' })
  getConfidence(@Param('code') code: string) {
    return this.addressesService.getConfidence(code);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get address by code (public — for riders & sharing)' })
  @ApiParam({ name: 'code', example: 'BXR-204-17' })
  findByCode(@Param('code') code: string) {
    return this.addressesService.findByCode(code);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an address' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.addressesService.remove(user.id, id);
  }

  @Put(':id/primary')
  @ApiOperation({ summary: 'Set address as primary' })
  setPrimary(@CurrentUser() user: any, @Param('id') id: string) {
    return this.addressesService.setPrimary(user.id, id);
  }
}
