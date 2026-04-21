import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, RiderDeliveryStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

const ORDER_INCLUDE = {
  buyer: { select: { id: true, name: true, phone: true, avatar: true } },
  seller: { select: { id: true, name: true, phone: true, avatar: true } },
  product: true,
  smartAddress: true,
  stream: { select: { id: true, title: true } },
  delivery: {
    include: {
      rider: { select: { id: true, name: true, phone: true } },
    },
  },
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private calcDeliveryFee(currency: string): number {
    if (currency === 'NGN') return Number(this.config.get('DEFAULT_DELIVERY_FEE_NGN', 1500));
    return Number(this.config.get('DEFAULT_DELIVERY_FEE_KES', 200));
  }

  async create(buyerId: string, dto: CreateOrderDto) {
    // Validate SmartAddress
    const address = await this.prisma.smartAddress.findUnique({
      where: { code: dto.smartAddressCode },
    });
    if (!address) {
      throw new NotFoundException(`SmartAddress code ${dto.smartAddressCode} not found`);
    }

    let product = null;
    if (dto.productId) {
      product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
      if (!product) throw new NotFoundException('Product not found');
      if (!product.isActive) throw new BadRequestException('Product is no longer available');
      if (product.stockCount < dto.quantity) {
        throw new BadRequestException(`Only ${product.stockCount} unit(s) left in stock`);
      }
    }

    const currency = dto.currency ?? product?.currency ?? 'KES';
    const totalAmount = product ? product.price * dto.quantity : 0;
    const deliveryFee = this.calcDeliveryFee(currency);

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          buyerId,
          sellerId:        product?.sellerId ?? null,
          productId:       dto.productId ?? null,
          quantity:        dto.quantity,
          totalAmount,
          currency,
          smartAddressCode: dto.smartAddressCode,
          deliveryFee,
          streamId:        dto.streamId ?? null,
          paymentMethod:   dto.paymentMethod ?? null,
        },
        include: ORDER_INCLUDE,
      });

      if (product) {
        await tx.product.update({
          where: { id: dto.productId },
          data: { stockCount: { decrement: dto.quantity } },
        });
      }

      return created;
    });

    this.scheduleDeliverySimulation(order.id);

    return order;
  }

  private scheduleDeliverySimulation(orderId: string) {
    const SIMULATED_RIDER = {
      riderPhone: '+234 803 987 6543',
      riderName:  'Seun Adeyemi',
      riderLocation: { lat: 6.4698, lng: 3.5852 },
    };

    const stages: Array<{ delay: number; status: OrderStatus; rider?: typeof SIMULATED_RIDER }> = [
      { delay: 60_000,        status: OrderStatus.PICKED_UP,        rider: SIMULATED_RIDER },
      { delay: 5 * 60_000,   status: OrderStatus.IN_TRANSIT },
      { delay: 10 * 60_000,  status: OrderStatus.OUT_FOR_DELIVERY },
      { delay: 15 * 60_000,  status: OrderStatus.DELIVERED },
    ];

    stages.forEach(({ delay, status, rider }) => {
      setTimeout(async () => {
        try {
          const order = await this.prisma.order.findUnique({ where: { id: orderId } });
          if (!order) return;

          let riderUserId: string | undefined;
          if (rider) {
            const riderUser = await this.prisma.user.upsert({
              where:  { phone: rider.riderPhone },
              create: { phone: rider.riderPhone, name: rider.riderName, roles: ['RIDER'] },
              update: { name: rider.riderName },
            });
            riderUserId = riderUser.id;
          }

          const effectiveRiderId = riderUserId ?? order.riderId ?? undefined;
          if (effectiveRiderId) {
            const deliveryStatus: RiderDeliveryStatus =
              status === OrderStatus.DELIVERED ? RiderDeliveryStatus.DELIVERED :
              status === OrderStatus.PICKED_UP ? RiderDeliveryStatus.PICKED_UP :
              RiderDeliveryStatus.ASSIGNED;

            await this.prisma.riderDelivery.upsert({
              where:  { orderId },
              create: {
                orderId,
                riderId: effectiveRiderId,
                status: deliveryStatus,
                currentLat: rider?.riderLocation.lat ?? null,
                currentLng: rider?.riderLocation.lng ?? null,
                pickedUpAt:  status === OrderStatus.PICKED_UP  ? new Date() : undefined,
                deliveredAt: status === OrderStatus.DELIVERED  ? new Date() : undefined,
              },
              update: {
                status: deliveryStatus,
                ...(riderUserId && { riderId: riderUserId }),
                ...(rider?.riderLocation && { currentLat: rider.riderLocation.lat, currentLng: rider.riderLocation.lng }),
                ...(status === OrderStatus.PICKED_UP  && { pickedUpAt: new Date() }),
                ...(status === OrderStatus.DELIVERED  && { deliveredAt: new Date() }),
              },
            });
          }

          await this.prisma.order.update({
            where: { id: orderId },
            data: {
              status,
              updatedAt: new Date(),
              ...(riderUserId && { riderId: riderUserId }),
            },
          });
          console.log('[DeliverySimulation] order', orderId, '→', status);
        } catch (err: any) {
          console.error('[DeliverySimulation] failed for', orderId, err.message);
        }
      }, delay);
    });
  }

  async findForBuyer(buyerId: string) {
    return this.prisma.order.findMany({
      where: { buyerId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findForSeller(sellerId: string) {
    return this.prisma.order.findMany({
      where: { sellerId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');
    // Allow buyer, seller, or assigned rider
    const riderId = order.delivery?.riderId;
    if (order.buyerId !== userId && order.sellerId !== userId && riderId !== userId) {
      throw new ForbiddenException();
    }
    return order;
  }

  async updateStatus(userId: string, id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isRider = (user?.roles ?? []).includes('RIDER');
    const isSeller = order.sellerId === userId;

    if (!isRider && !isSeller) throw new ForbiddenException('Only riders or sellers can update status');

    if (dto.status === 'DELIVERED' && order.productId) {
      await this.prisma.product.update({
        where: { id: order.productId },
        data: { totalSold: { increment: order.quantity } },
      });
    }

    // Resolve rider user from phone if provided
    let riderUserId: string | undefined;
    if (dto.riderPhone) {
      const riderUser = await this.prisma.user.upsert({
        where: { phone: dto.riderPhone },
        create: {
          phone: dto.riderPhone,
          name: dto.riderName ?? dto.riderPhone,
          roles: ['RIDER'],
        },
        update: dto.riderName ? { name: dto.riderName } : {},
      });
      riderUserId = riderUser.id;
    }

    // Upsert RiderDelivery when we have a rider or location update
    const effectiveRiderId = riderUserId ?? order.riderId ?? undefined;
    if (effectiveRiderId) {
      const deliveryStatus: RiderDeliveryStatus =
        dto.status === 'DELIVERED' ? RiderDeliveryStatus.DELIVERED :
        dto.status === 'PICKED_UP' ? RiderDeliveryStatus.PICKED_UP :
        RiderDeliveryStatus.ASSIGNED;

      await this.prisma.riderDelivery.upsert({
        where: { orderId: id },
        create: {
          orderId: id,
          riderId: effectiveRiderId,
          status: deliveryStatus,
          currentLat: dto.riderLocation?.lat ?? null,
          currentLng: dto.riderLocation?.lng ?? null,
          pickedUpAt: dto.status === 'PICKED_UP' ? new Date() : undefined,
          deliveredAt: dto.status === 'DELIVERED' ? new Date() : undefined,
        },
        update: {
          status: deliveryStatus,
          ...(riderUserId && { riderId: riderUserId }),
          ...(dto.riderLocation && {
            currentLat: dto.riderLocation.lat,
            currentLng: dto.riderLocation.lng,
          }),
          ...(dto.status === 'PICKED_UP' && { pickedUpAt: new Date() }),
          ...(dto.status === 'DELIVERED' && { deliveredAt: new Date() }),
        },
      });
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        updatedAt: new Date(),
        ...(riderUserId && { riderId: riderUserId }),
      },
      include: ORDER_INCLUDE,
    });
  }

  async findBySmartAddress(code: string) {
    const address = await this.prisma.smartAddress.findUnique({ where: { code } });
    if (!address) throw new NotFoundException(`SmartAddress ${code} not found`);

    return this.prisma.order.findMany({
      where: { smartAddressCode: code },
      include: {
        product: { select: { id: true, name: true, photos: true } },
        seller: { select: { id: true, name: true, avatar: true } },
        delivery: {
          select: {
            currentLat:  true,
            currentLng:  true,
            pickedUpAt:  true,
            deliveredAt: true,
            assignedAt:  true,
            rider: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
