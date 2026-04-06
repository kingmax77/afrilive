import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findMine(sellerId: string) {
    return this.prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPublicBySeller(sellerId: string) {
    return this.prisma.product.findMany({
      where: { sellerId, isActive: true },
      orderBy: { totalSold: 'desc' },
    });
  }

  async create(sellerId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        sellerId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        currency: dto.currency ?? 'KES',
        category: dto.category,
        photos: dto.photos ?? [],
        stockCount: dto.stockCount ?? 0,
      },
    });
  }

  async update(sellerId: string, id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId !== sellerId) throw new ForbiddenException();
    return this.prisma.product.update({ where: { id }, data: dto as any });
  }

  async remove(sellerId: string, id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId !== sellerId) throw new ForbiddenException();
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product deleted' };
  }
}
