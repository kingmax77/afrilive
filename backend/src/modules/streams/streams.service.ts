import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStreamDto, PinProductDto } from './dto/stream.dto';

@Injectable()
export class StreamsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async findAll() {
    return this.prisma.stream.findMany({
      where: { status: { in: ['LIVE', 'SCHEDULED'] } },
      include: {
        seller: { select: { id: true, name: true, avatar: true } },
        pinnedProduct: true,
      },
      orderBy: [{ status: 'asc' }, { scheduledFor: 'asc' }],
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
    return this.prisma.stream.create({
      data: {
        sellerId,
        title: dto.title,
        category: dto.category,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
        thumbnailUrl: dto.thumbnailUrl,
      },
    });
  }

  async start(sellerId: string, id: string) {
    const stream = await this.prisma.stream.findUnique({ where: { id } });
    if (!stream) throw new NotFoundException('Stream not found');
    if (stream.sellerId !== sellerId) throw new ForbiddenException();
    if (stream.status === 'LIVE') throw new BadRequestException('Stream already live');
    if (stream.status === 'ENDED') throw new BadRequestException('Stream already ended');

    // Generate a short-lived Agora token placeholder.
    // In production: call Agora Token Server with appId + certificate
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

    // Aggregate viewer / order stats
    const orderCount = await this.prisma.order.count({ where: { streamId: id } });

    return this.prisma.stream.update({
      where: { id },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
        agoraToken: null,
        pinnedProductId: null,
      },
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
      include: { pinnedProduct: true },
    });
  }
}
