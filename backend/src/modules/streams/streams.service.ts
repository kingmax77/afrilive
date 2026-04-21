import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStreamDto, PinProductDto, UpdateStreamDto } from './dto/stream.dto';

@Injectable()
export class StreamsService {
  private readonly logger = new Logger(StreamsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private get streamIncludes() {
    return {
      seller: {
        select: { id: true, name: true, phone: true },
      },
      pinnedProduct: {
        select: { id: true, name: true, price: true, currency: true, category: true },
      },
    } as const;
  }

  async findAll() {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return await this.prisma.stream.findMany({
        where: {
          status: { in: ['LIVE', 'SCHEDULED'] },
          createdAt: { gte: since },
        },
        include: this.streamIncludes,
        orderBy: [{ startedAt: 'desc' }, { createdAt: 'desc' }],
      });
    } catch (err) {
      this.logger.error('findAll failed', err);
      throw err;
    }
  }

  async findLive() {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return await this.prisma.stream.findMany({
        where: {
          status: 'LIVE',
          createdAt: { gte: since },
        },
        include: this.streamIncludes,
        orderBy: [{ startedAt: 'desc' }, { createdAt: 'desc' }],
      });
    } catch (err) {
      this.logger.error('findLive failed', err);
      throw err;
    }
  }

  async findOne(id: string) {
    try {
      const stream = await this.prisma.stream.findUnique({
        where: { id },
        include: {
          seller: { select: { id: true, name: true, avatar: true } },
          pinnedProduct: true,
        },
      });
      if (!stream) throw new NotFoundException('Stream not found');
      return stream;
    } catch (err) {
      this.logger.error(`findOne(${id}) failed`, err);
      throw err;
    }
  }

  async create(sellerId: string, dto: CreateStreamDto) {
    try {
      const data: any = {
        sellerId,
        title: dto.title,
        category: dto.category,
        thumbnailUrl: dto.thumbnailUrl,
        status: 'LIVE',
        viewerCount: 0,
        startedAt: new Date(),
        agoraToken: `agora-token-${Date.now()}`,
      };

      if (dto.pinnedProductId) {
        const product = await this.prisma.product.findUnique({
          where: { id: dto.pinnedProductId },
        });
        if (product && product.sellerId === sellerId) {
          data.pinnedProductId = dto.pinnedProductId;
        }
      }

      return await this.prisma.stream.create({
        data,
        include: this.streamIncludes,
      });
    } catch (err) {
      this.logger.error('create failed', err);
      throw err;
    }
  }

  async update(sellerId: string, id: string, dto: UpdateStreamDto) {
    try {
      const stream = await this.prisma.stream.findUnique({ where: { id } });
      if (!stream) throw new NotFoundException('Stream not found');
      if (stream.sellerId !== sellerId) throw new ForbiddenException();

      return await this.prisma.stream.update({
        where: { id },
        data: {
          ...(dto.viewerCount !== undefined && { viewerCount: dto.viewerCount }),
        },
        include: this.streamIncludes,
      });
    } catch (err) {
      this.logger.error(`update(${id}) failed`, err);
      throw err;
    }
  }

  async start(sellerId: string, id: string) {
    try {
      const stream = await this.prisma.stream.findUnique({ where: { id } });
      if (!stream) throw new NotFoundException('Stream not found');
      if (stream.sellerId !== sellerId) throw new ForbiddenException();
      if (stream.status === 'LIVE') throw new BadRequestException('Stream already live');
      if (stream.status === 'ENDED') throw new BadRequestException('Stream already ended');

      const agoraToken = `agora-token-${Date.now()}`;

      return await this.prisma.stream.update({
        where: { id },
        data: { status: 'LIVE', startedAt: new Date(), agoraToken },
        include: this.streamIncludes,
      });
    } catch (err) {
      this.logger.error(`start(${id}) failed`, err);
      throw err;
    }
  }

  async end(sellerId: string, id: string) {
    try {
      const stream = await this.prisma.stream.findUnique({ where: { id } });
      if (!stream) throw new NotFoundException('Stream not found');
      if (stream.sellerId !== sellerId) throw new ForbiddenException();
      if (stream.status !== 'LIVE') throw new BadRequestException('Stream is not live');

      return await this.prisma.stream.update({
        where: { id },
        data: {
          status: 'ENDED',
          endedAt: new Date(),
          agoraToken: null,
          pinnedProductId: null,
        },
        include: this.streamIncludes,
      });
    } catch (err) {
      this.logger.error(`end(${id}) failed`, err);
      throw err;
    }
  }

  async pinProduct(sellerId: string, id: string, dto: PinProductDto) {
    try {
      const stream = await this.prisma.stream.findUnique({ where: { id } });
      if (!stream) throw new NotFoundException('Stream not found');
      if (stream.sellerId !== sellerId) throw new ForbiddenException();
      if (stream.status !== 'LIVE') throw new BadRequestException('Can only pin to a live stream');

      const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
      if (!product) throw new NotFoundException('Product not found');
      if (product.sellerId !== sellerId) throw new ForbiddenException();

      return await this.prisma.stream.update({
        where: { id },
        data: { pinnedProductId: dto.productId },
        include: this.streamIncludes,
      });
    } catch (err) {
      this.logger.error(`pinProduct(${id}) failed`, err);
      throw err;
    }
  }
}
