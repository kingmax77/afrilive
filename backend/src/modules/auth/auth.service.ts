import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SendOtpDto, VerifyOtpDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private redis: RedisService,
    private config: ConfigService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private otpKey(phone: string): string {
    return `otp:${phone}`;
  }

  async sendOtp(dto: SendOtpDto) {
    const otp = this.generateOtp();
    const ttl = this.config.get<number>('OTP_EXPIRY_SECONDS', 300);

    await this.redis.set(this.otpKey(dto.phone), otp, ttl);

    // Store in DB for auditing
    await this.prisma.otpCode.create({
      data: {
        phone: dto.phone,
        code: otp,
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });

    const devMode = this.config.get('OTP_DEV_MODE') === 'true';

    // In production: send via SMS gateway. For now return OTP in dev mode.
    return {
      message: `OTP sent to ${dto.phone}`,
      ...(devMode ? { otp } : {}),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const stored = await this.redis.get(this.otpKey(dto.phone));
    if (!stored || stored !== dto.otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.redis.del(this.otpKey(dto.phone));

    let user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });

    if (!user) {
      // Auto-create a minimal buyer account on first login
      user = await this.prisma.user.create({
        data: { phone: dto.phone, name: 'New User', role: 'BUYER', isVerified: true },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    const token = this.jwt.sign({ sub: user.id, phone: user.phone });
    return { token, user };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('Phone number already registered');

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        name: dto.name,
        role: dto.role,
        avatar: dto.avatar,
      },
    });

    const token = this.jwt.sign({ sub: user.id, phone: user.phone });
    return { token, user };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: { where: { isPrimary: true }, take: 1 },
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
