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
import { StreamsService } from './streams.service';
import { CreateStreamDto, PinProductDto } from './dto/stream.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Streams')
@Controller('streams')
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all live and upcoming streams (public feed)' })
  findAll() {
    return this.streamsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get stream details by ID' })
  findOne(@Param('id') id: string) {
    return this.streamsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or schedule a new stream' })
  create(@CurrentUser() user: any, @Body() dto: CreateStreamDto) {
    return this.streamsService.create(user.id, dto);
  }

  @Put(':id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a stream — marks as LIVE, issues Agora token' })
  start(@CurrentUser() user: any, @Param('id') id: string) {
    return this.streamsService.start(user.id, id);
  }

  @Put(':id/end')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End a stream — marks as ENDED, saves stats' })
  end(@CurrentUser() user: any, @Param('id') id: string) {
    return this.streamsService.end(user.id, id);
  }

  @Put(':id/pin-product')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pin a product to the active stream' })
  pinProduct(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: PinProductDto,
  ) {
    return this.streamsService.pinProduct(user.id, id, dto);
  }
}
