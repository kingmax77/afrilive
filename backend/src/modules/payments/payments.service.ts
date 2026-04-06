import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
// HttpService is provided by @nestjs/axios HttpModule
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { InitializePaymentDto, FlutterwaveWebhookDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private http: HttpService,
  ) {}

  // ── Flutterwave ────────────────────────────────────────────────────────────
  async initializeFlutterwave(userId: string, dto: InitializePaymentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== userId) throw new BadRequestException('Not your order');
    if (order.paymentStatus === 'PAID') throw new BadRequestException('Order already paid');

    const txRef = `AFR-${order.id}-${Date.now()}`;
    const amount = order.totalAmount + order.deliveryFee;

    const payload = {
      tx_ref: txRef,
      amount,
      currency: order.currency,
      redirect_url: `${this.config.get('APP_URL')}/payments/flutterwave/callback`,
      customer: {
        email: dto.email,
        phonenumber: dto.phone,
        name: userId,
      },
      customizations: {
        title: 'Afrimarket',
        description: `Payment for order ${order.id}`,
      },
      meta: { orderId: order.id },
    };

    const secretKey = this.config.get<string>('FLUTTERWAVE_SECRET_KEY');

    try {
      const response = await firstValueFrom(
        this.http.post('https://api.flutterwave.com/v3/payments', payload, {
          headers: { Authorization: `Bearer ${secretKey}` },
        }),
      );

      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentReference: txRef },
      });

      return {
        paymentUrl: response.data.data.link,
        txRef,
        amount,
        currency: order.currency,
      };
    } catch (err) {
      this.logger.error('Flutterwave init failed', err?.response?.data);
      throw new BadRequestException('Payment initialization failed');
    }
  }

  // ── Flutterwave webhook ────────────────────────────────────────────────────
  async handleFlutterwaveWebhook(signature: string, body: FlutterwaveWebhookDto) {
    const webhookSecret = this.config.get<string>('FLUTTERWAVE_WEBHOOK_SECRET');
    if (signature !== webhookSecret) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    if (body.event === 'charge.completed' && body.data.status === 'successful') {
      const txRef = body.data.tx_ref;
      const order = await this.prisma.order.findFirst({
        where: { paymentReference: txRef },
      });

      if (order && order.paymentStatus !== 'PAID') {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'PAID' },
        });
        this.logger.log(`Order ${order.id} payment confirmed via webhook`);
      }
    }

    return { received: true };
  }

  // ── Verify payment ─────────────────────────────────────────────────────────
  async verifyPayment(reference: string) {
    const order = await this.prisma.order.findFirst({
      where: { paymentReference: reference },
    });
    if (!order) throw new NotFoundException('Order with this reference not found');

    const secretKey = this.config.get<string>('FLUTTERWAVE_SECRET_KEY');

    try {
      const response = await firstValueFrom(
        this.http.get(
          `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`,
          { headers: { Authorization: `Bearer ${secretKey}` } },
        ),
      );

      const status = response.data?.data?.status;
      if (status === 'successful' && order.paymentStatus !== 'PAID') {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'PAID' },
        });
      }

      return {
        reference,
        gatewayStatus: status,
        localStatus: order.paymentStatus,
        orderId: order.id,
      };
    } catch (err) {
      this.logger.error('Flutterwave verify failed', err?.response?.data);
      throw new BadRequestException('Payment verification failed');
    }
  }
}
