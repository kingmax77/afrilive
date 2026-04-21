import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StreamsController } from './streams.controller';
import { StreamsService } from './streams.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [StreamsController],
  providers: [StreamsService],
})
export class StreamsModule {}
