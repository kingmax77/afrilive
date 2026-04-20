import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

const ORDER_INCLUDE = {
  buyer: { select: { id: true, name: true, phone: true, avatar: true } },
  seller: { select: { id: true, name: true, phone: true, avatar: true } },
  product: true,
  smartAddress: true,
  stream: { select: { id: true, title: true } },
  delivery: true,
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

    return order;
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

    if (dto.status === 'DELIVERED') {
      // Mark product totalSold
      await this.prisma.product.update({
        where: { id: order.productId },
        data: { totalSold: { increment: order.quantity } },
      });
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
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
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
