import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SendOtpDto, VerifyOtpDto, RegisterDto, AddRoleDto } from './dto/auth.dto';

const userSelect = {
  id: true,
  phone: true,
  name: true,
  roles: true,
  avatar: true,
  isVerified: true,
  createdAt: true,
} as const;

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
    const ttl = this.config.get<number>('OTP_EXPIRY_SECONDS', 600);

    await this.redis.set(this.otpKey(dto.phone), otp, ttl);

    await this.prisma.otpCode.create({
      data: {
        phone: dto.phone,
        code: otp,
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });

    const devMode = this.config.get('NODE_ENV') !== 'production';

    return {
      message: 'OTP sent successfully',
      ...(devMode ? { otp } : {}),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const stored = await this.redis.get(this.otpKey(dto.phone));
    if (!stored || stored !== dto.otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.redis.del(this.otpKey(dto.phone));

    let user = await this.prisma.user.findUnique({ where: { phone: dto.phone }, select: userSelect });
    const isNewUser = !user;

    if (!user) {
      user = await this.prisma.user.create({
        data: { phone: dto.phone, name: 'New User', roles: [], isVerified: true },
        select: userSelect,
      });
    } else {
      user = await this.prisma.user.update({
        where: { phone: dto.phone },
        data: { isVerified: true },
        select: userSelect,
      });
    }

    const token = this.jwt.sign({ sub: user.id, phone: user.phone });
    return { token, user: { ...user, roles: user.roles ?? [] }, isNewUser };
  }

  async register(dto: RegisterDto) {
    let user = await this.prisma.user.findUnique({ where: { phone: dto.phone }, select: userSelect });
    const isNewUser = !user;

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          name: dto.name,
          roles: [dto.role],
          avatar: dto.avatar,
        },
        select: userSelect,
      });
    } else {
      const currentRoles = user.roles ?? [];
      const updatedRoles = currentRoles.includes(dto.role)
        ? currentRoles
        : [...currentRoles, dto.role];

      user = await this.prisma.user.update({
        where: { phone: dto.phone },
        data: {
          name: user.name && user.name !== 'New User' ? user.name : dto.name,
          roles: updatedRoles,
          ...(dto.avatar && !user.avatar ? { avatar: dto.avatar } : {}),
        },
        select: userSelect,
      });
    }

    const token = this.jwt.sign({ sub: user.id, phone: user.phone });
    return { token, user: { ...user, roles: user.roles ?? [] }, isNewUser };
  }

  async addRole(userId: string, dto: AddRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: userSelect });
    if (!user) throw new UnauthorizedException();

    const currentRoles = user.roles ?? [];
    if (currentRoles.includes(dto.role)) {
      return { ...user, roles: currentRoles };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { roles: { push: dto.role } },
      select: userSelect,
    });
    return { ...updatedUser, roles: updatedUser.roles ?? [] };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...userSelect,
        addresses: { where: { isPrimary: true }, take: 1 },
      },
    });
    if (!user) throw new UnauthorizedException();
    return { ...user, roles: user.roles ?? [] };
  }
}
