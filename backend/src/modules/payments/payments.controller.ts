import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiHeader } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitializePaymentDto, FlutterwaveWebhookDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize Flutterwave payment for an order' })
  initialize(@CurrentUser() user: any, @Body() dto: InitializePaymentDto) {
    return this.paymentsService.initializeFlutterwave(user.id, dto);
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Flutterwave webhook — confirms payment and updates order status',
  })
  @ApiHeader({ name: 'verif-hash', description: 'Flutterwave webhook signature' })
  webhook(
    @Headers('verif-hash') signature: string,
    @Body() body: FlutterwaveWebhookDto,
  ) {
    return this.paymentsService.handleFlutterwaveWebhook(signature, body);
  }

  @Get('verify/:reference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment status by transaction reference' })
  verify(@Param('reference') reference: string) {
    return this.paymentsService.verifyPayment(reference);
  }
}
