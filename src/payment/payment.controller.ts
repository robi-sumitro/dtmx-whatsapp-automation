import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Get('manual-info')
  manualInfo() {
    return this.payments.manualInfo();
  }

  @Post('settings')
  setSetting(@Body() body: any) {
    return this.payments.setManualSetting(
      body.key,
      body.label,
      body.value,
      body.order ?? 0,
    );
  }

  @Post('invoices')
  createInvoice(@Body() body: any) {
    return this.payments.createInvoice({
      businessId: body.businessId,
      amount: body.amount,
      note: body.note,
      planId: body.planId,
    });
  }

  @Post('invoices/:id/proof')
  attachProof(@Param('id') id: string, @Body() body: any) {
    return this.payments.attachProof(id, body.fileUrl, body.note);
  }

  @Post('invoices/:id/confirm')
  confirm(@Param('id') id: string, @Body() body: any) {
    return this.payments.confirm(id, body.note);
  }

  @Post('invoices/:id/reject')
  reject(@Param('id') id: string, @Body() body: any) {
    return this.payments.reject(id, body.note);
  }

  @Get('invoices')
  list() {
    return this.payments.list();
  }
}