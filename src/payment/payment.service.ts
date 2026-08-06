import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WaInvoiceStatus } from '@prisma/client';

/**
 * Pembayaran MANUAL (MVP): invoice dibuat, pelanggan transfer + upload bukti,
 * lalu admin konfirmasi/ tolak. Tidak memerlukan gateway (menunggu verifikasi
 * Tripay/Midtrans/Stripe).
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Ambil info rekening tujuan yang dikonfigurasi admin. */
  async manualInfo() {
    const settings = await this.prisma.paymentSetting.findMany({
      orderBy: { order: 'asc' },
    });
    const info: Record<string, string> = {};
    for (const s of settings) info[s.key] = s.value || '';
    return info;
  }

  /** Upsert config rekening/manual (admin). */
  async setManualSetting(key: string, label: string, value: string, order = 0) {
    return this.prisma.paymentSetting.upsert({
      where: { key },
      create: { key, label, value, order },
      update: { label, value, order },
    });
  }

  /** Buat tagihan untuk bisnis (mis. langganan bulanan atau jasa setup). */
  async createInvoice(input: {
    businessId: string;
    amount: number;
    note?: string;
    planId?: string;
  }) {
    const business = await this.prisma.waBusiness.findUnique({
      where: { id: input.businessId },
    });
    if (!business) throw new NotFoundException('WaBusiness tidak ditemukan');
    return this.prisma.waInvoice.create({
      data: {
        businessId: input.businessId,
        amount: input.amount,
        note: input.note,
        planId: input.planId,
      },
    });
  }

  /** Upload bukti transfer ke invoice PENDING. */
  async attachProof(invoiceId: string, fileUrl: string, note?: string) {
    const invoice = await this.prisma.waInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice tidak ditemukan');
    if (invoice.status !== WaInvoiceStatus.PENDING) {
      throw new BadRequestException('Hanya invoice PENDING boleh diunggah bukti');
    }
    return this.prisma.waInvoiceProof.create({
      data: { invoiceId, fileUrl, note },
    });
  }

  /** Admin: setujui pembayaran → invoice PAID. */
  async confirm(invoiceId: string, note?: string) {
    const invoice = await this.prisma.waInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice tidak ditemukan');
    if (invoice.status === WaInvoiceStatus.PAID) {
      throw new BadRequestException('Invoice sudah dibayar');
    }
    return this.prisma.waInvoice.update({
      where: { id: invoiceId },
      data: { status: WaInvoiceStatus.PAID, paidAt: new Date(), note },
    });
  }

  /** Admin: tolak pembayaran → invoice REJECTED. */
  async reject(invoiceId: string, note?: string) {
    const invoice = await this.prisma.waInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice tidak ditemukan');
    return this.prisma.waInvoice.update({
      where: { id: invoiceId },
      data: { status: WaInvoiceStatus.REJECTED, note },
    });
  }

  /** Daftar invoice dengan bukti pendukung. */
  async list() {
    return this.prisma.waInvoice.findMany({
      include: { proofs: true, business: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}