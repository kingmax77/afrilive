import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStreamDto, PinProductDto, UpdateStreamDto } from './dto/stream.dto';

@Injectable()
export class StreamsService {
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
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.stream.findMany({
      where: {
        status: { in: ['LIVE', 'SCHEDULED'] },
        createdAt: { gte: since },
      },
      include: this.streamIncludes,
      orderBy: { startedAt: 'desc' },
    });
  }

  async findLive() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.stream.findMany({
      where: {
        status: 'LIVE',
        createdAt: { gte: since },
      },
      include: this.streamIncludes,
      orderBy: { startedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const stream = await this.prisma.stream.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, avatar: true } },
        pinnedProduct: true,
      },
    });
    if (!stream) throw new NotFoundException('Stream not found');
    return stream;
  }

  async create(sellerId: string, dto: CreateStreamDto) {
    const data: any = {
      sellerId,
      title: dto.title,
      category: dto.category,
      thumbnailUrl: dto.thumbnailUrl,
      status: 'LIVE',
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

    return this.prisma.stream.create({
      data,
      include: this.streamIncludes,
    });
  }

  async update(sellerId: string, id: string, dto: UpdateStreamDto) {
    const stream = await this.prisma.stream.findUnique({ where: { id } });
    if (!stream) throw new NotFoundException('Stream not found');
    if (stream.sellerId !== sellerId) throw new ForbiddenException();

    return this.prisma.stream.update({
      where: { id },
      data: {
        ...(dto.viewerCount !== undefined && { viewerCount: dto.viewerCount }),
      },
    });
  }

  async start(sellerId: string, id: string) {
    const stream = await this.prisma.stream.findUnique({ where: { id } });
    if (!stream) throw new NotFoundException('Stream not found');
    if (stream.sellerId !== sellerId) throw new ForbiddenException();
    if (stream.status === 'LIVE') throw new BadRequestException('Stream already live');
    if (stream.status === 'ENDED') throw new BadRequestException('Stream already ended');

    const agoraToken = `agora-token-${Date.now()}`;

    return this.prisma.stream.update({
      where: { id },
      data: { status: 'LIVE', startedAt: new Date(), agoraToken },
    });
  }

  async end(sellerId: string, id: string) {
    const stream = await this.prisma.stream.findUnique({ where: { id } });
    if (!stream) throw new NotFoundException('Stream not found');
    if (stream.sellerId !== sellerId) throw new ForbiddenException();
    if (stream.status !== 'LIVE') throw new BadRequestException('Stream is not live');

    return this.prisma.stream.update({
      where: { id },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
        agoraToken: null,
        pinnedProductId: null,
      },
      include: this.streamIncludes,
    });
  }

  async pinProduct(sellerId: string, id: string, dto: PinProductDto) {
    const stream = await this.prisma.stream.findUnique({ where: { id } });
    if (!stream) throw new NotFoundException('Stream not found');
    if (stream.sellerId !== sellerId) throw new ForbiddenException();
    if (stream.status !== 'LIVE') throw new BadRequestException('Can only pin to a live stream');

    // Verify product belongs to seller
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId !== sellerId) throw new ForbiddenException();

    return this.prisma.stream.update({
      where: { id },
      data: { pinnedProductId: dto.productId },
      include: this.streamIncludes,
    });
  }
}
