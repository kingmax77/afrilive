import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { AssignRiderDto, UpdateLocationDto } from './dto/delivery.dto';

@Injectable()
export class DeliveryService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private locationKey(orderId: string) {
    return `rider-location:${orderId}`;
  }

  async assign(dto: AssignRiderDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw new BadRequestException('Cannot assign rider to a completed or cancelled order');
    }

    const existing = await this.prisma.riderDelivery.findUnique({
      where: { orderId: dto.orderId },
    });
    if (existing) throw new ConflictException('Rider already assigned to this order');

    const rider = await this.prisma.user.findUnique({ where: { id: dto.riderId } });
    if (!rider || !(rider.roles ?? []).includes('RIDER')) throw new BadRequestException('User is not a rider');

    const delivery = await this.prisma.riderDelivery.create({
      data: {
        riderId: dto.riderId,
        orderId: dto.orderId,
        status: 'ASSIGNED',
      },
    });

    await this.prisma.order.update({
      where: { id: dto.orderId },
      data: { riderId: dto.riderId, status: 'IN_TRANSIT' },
    });

    return delivery;
  }

  async updateLocation(riderId: string, orderId: string, dto: UpdateLocationDto) {
    const delivery = await this.prisma.riderDelivery.findUnique({ where: { orderId } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.riderId !== riderId) throw new ForbiddenException();

    // Persist to DB for history & cache in Redis for real-time tracking
    await this.prisma.riderDelivery.update({
      where: { orderId },
      data: { currentLat: dto.lat, currentLng: dto.lng },
    });

    await this.redis.set(
      this.locationKey(orderId),
      JSON.stringify({ lat: dto.lat, lng: dto.lng, updatedAt: new Date() }),
      300, // 5-minute TTL; rider should ping every 30s
    );

    return { message: 'Location updated', lat: dto.lat, lng: dto.lng };
  }

  async track(orderId: string) {
    const delivery = await this.prisma.riderDelivery.findUnique({
      where: { orderId },
      include: { rider: { select: { id: true, name: true, phone: true, avatar: true } } },
    });
    if (!delivery) throw new NotFoundException('No active delivery for this order');

    // Prefer hot Redis cache; fall back to DB
    const cached = await this.redis.get(this.locationKey(orderId));
    const location = cached
      ? JSON.parse(cached)
      : { lat: delivery.currentLat, lng: delivery.currentLng, updatedAt: null };

    return {
      orderId,
      status: delivery.status,
      rider: delivery.rider,
      location,
    };
  }

  async markDelivered(riderId: string, orderId: string) {
    const delivery = await this.prisma.riderDelivery.findUnique({ where: { orderId } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.riderId !== riderId) throw new ForbiddenException();
    if (delivery.status === 'DELIVERED') throw new BadRequestException('Already delivered');

    await this.prisma.$transaction([
      this.prisma.riderDelivery.update({
        where: { orderId },
        data: { status: 'DELIVERED', deliveredAt: new Date() },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'DELIVERED' },
      }),
      // Increment seller totalSold
      this.prisma.order.findUnique({ where: { id: orderId } }).then(async (o) => {
        if (o) {
          await this.prisma.product.update({
            where: { id: o.productId },
            data: { totalSold: { increment: o.quantity } },
          });
        }
      }) as any,
    ]);

    await this.redis.del(this.locationKey(orderId));

    return { message: 'Order marked as delivered', orderId };
  }
}
