import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  // ── Code generation ────────────────────────────────────────────────────────
  private async generateCode(): Promise<string> {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O to avoid confusion
    const rand3 = () =>
      Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    const rand3digits = () => Math.floor(100 + Math.random() * 900).toString();
    const rand2digits = () => Math.floor(10 + Math.random() * 90).toString();

    let code: string;
    let attempts = 0;
    do {
      code = `${rand3()}-${rand3digits()}-${rand2digits()}`;
      attempts++;
      if (attempts > 100) throw new Error('Could not generate unique address code');
    } while (await this.prisma.smartAddress.findUnique({ where: { code } }));

    return code;
  }

  // ── Confidence score calculation ───────────────────────────────────────────
  private calcConfidence(data: CreateAddressDto): number {
    let score = 40; // base for lat/lng
    if (data.landmark) score += 20;
    if (data.gateColor) score += 10;
    if (data.arrivalInstructions) score += 10;
    if (data.deliveryNotes) score += 10;
    if (data.photos && data.photos.length > 0) score += 10;
    return Math.min(score, 100);
  }

  async findAll(userId: string) {
    return this.prisma.smartAddress.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(userId: string, dto: CreateAddressDto) {
    const code = await this.generateCode();
    const confidenceScore = this.calcConfidence(dto);

    // If setting as primary, unset others
    if (dto.isPrimary) {
      await this.prisma.smartAddress.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.smartAddress.create({
      data: {
        userId,
        code,
        confidenceScore,
        label: dto.label ?? 'Home',
        lat: dto.lat,
        lng: dto.lng,
        landmark: dto.landmark,
        gateColor: dto.gateColor,
        floor: dto.floor,
        arrivalInstructions: dto.arrivalInstructions,
        photos: dto.photos ?? [],
        deliveryNotes: dto.deliveryNotes,
        isPrimary: dto.isPrimary ?? false,
      },
    });
  }

  async findByCode(code: string) {
    const address = await this.prisma.smartAddress.findUnique({ where: { code } });
    if (!address) throw new NotFoundException(`SmartAddress ${code} not found`);
    return address;
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.prisma.smartAddress.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) throw new ForbiddenException();

    if (dto.isPrimary) {
      await this.prisma.smartAddress.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    const updatedData: any = { ...dto };
    // Recalculate confidence if spatial/descriptive fields change
    const merged = { ...address, ...dto };
    updatedData.confidenceScore = this.calcConfidence(merged as any);

    return this.prisma.smartAddress.update({ where: { id }, data: updatedData });
  }

  async remove(userId: string, id: string) {
    const address = await this.prisma.smartAddress.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) throw new ForbiddenException();
    await this.prisma.smartAddress.delete({ where: { id } });
    return { message: 'Address deleted' };
  }

  async setPrimary(userId: string, id: string) {
    const address = await this.prisma.smartAddress.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) throw new ForbiddenException();

    await this.prisma.smartAddress.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });
    return this.prisma.smartAddress.update({ where: { id }, data: { isPrimary: true } });
  }

  async getConfidence(code: string) {
    const address = await this.findByCode(code);
    return {
      code: address.code,
      score: address.confidenceScore,
      breakdown: {
        hasCoordinates: true,
        hasLandmark: !!address.landmark,
        hasGateColor: !!address.gateColor,
        hasArrivalInstructions: !!address.arrivalInstructions,
        hasDeliveryNotes: !!address.deliveryNotes,
        hasPhotos: address.photos.length > 0,
      },
      label:
        address.confidenceScore >= 90
          ? 'High confidence — delivery will be fast'
          : address.confidenceScore >= 70
          ? 'Medium confidence — may need a call'
          : 'Low confidence — rider will likely need help',
    };
  }
}
