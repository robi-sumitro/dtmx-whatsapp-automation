import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { CryptoService } from '../common/crypto.service';
import { WaFlowState } from '@prisma/client';

@Injectable()
export class WaService {
  private readonly logger = new Logger(WaService.name);
  private readonly graphVersion = 'v21.0';

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AIService,
    private readonly config: ConfigService,
    private readonly crypto: CryptoService,
  ) {}

  // ==================== CONNECT ====================

  async connectBusiness(data: {
    businessName: string;
    phoneNumberId: string;
    wabaId: string;
    accessToken: string;
  }) {
    const accessTokenEnc = this.crypto.encrypt(data.accessToken);
    return this.prisma.waBusiness.upsert({
      where: { phoneNumberId: data.phoneNumberId },
      create: {
        name: data.businessName,
        phoneNumberId: data.phoneNumberId,
        wabaId: data.wabaId,
        accessTokenEnc,
      },
      update: {
        name: data.businessName,
        wabaId: data.wabaId,
        accessTokenEnc,
      },
    });
  }

  async listBusiness() {
    return this.prisma.waBusiness.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getConversations(businessId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.waConversation.findMany({
        where: { businessId },
        include: { messages: { orderBy: { sentAt: 'desc' }, take: 1 } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.waConversation.count({ where: { businessId } }),
    ]);
    return { items, total, page, limit };
  }

  async getConversationMessages(conversationId: string) {
    const conversation = await this.prisma.waConversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { sentAt: 'asc' } } },
    });
    if (!conversation) throw new NotFoundException('Konversasi tidak ditemukan');
    return conversation;
  }

  // ==================== WEBHOOK (Meta) ====================

  verify(challenge: string, mode: string | undefined, token: string | undefined) {
    if (mode === 'subscribe' && token && token === this.config.get('WA_VERIFY_TOKEN')) {
      return challenge;
    }
    throw new BadRequestException('Verifikasi webhook gagal: token tidak cocok');
  }

  async handleIncoming(payload: any) {
    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const messages = change?.messages;
    if (!messages?.length) return;

    const phoneNumberId = change.metadata?.phone_number_id;
    const business = await this.prisma.waBusiness.findUnique({
      where: { phoneNumberId },
    });
    if (!business) {
      this.logger.warn(`WaBusiness tidak cocok utk phoneNumber ${phoneNumberId}`);
      return;
    }
    const accessToken = this.crypto.decrypt(business.accessTokenEnc);

    for (const msg of messages) {
      if (msg.type !== 'text' || !msg.text?.body) continue;
      const from = msg.from;
      const conv = await this.upsertConversation(business.id, from);

      await this.prisma.waMessage.create({
        data: {
          conversationId: conv.id,
          direction: 'INBOUND',
          type: 'TEXT',
          body: msg.text.body,
          metaMsgId: msg.id,
        },
      });

      const reply = await this.evaluateFlow(conv, msg, business);
      if (!reply) continue;

      await this.sendText(phoneNumberId, accessToken, from, reply);
      await this.prisma.waMessage.create({
        data: {
          conversationId: conv.id,
          direction: 'OUTBOUND',
          type: 'TEXT',
          body: reply,
          viaAi: conv.lastAi,
        },
      });
    }
  }

  private async upsertConversation(businessId: string, waRecipient: string) {
    const existing = await this.prisma.waConversation.findFirst({
      where: { businessId, waRecipient },
    });
    if (existing) return existing;
    return this.prisma.waConversation.create({
      data: { businessId, waRecipient },
    });
  }

  private async evaluateFlow(
    conv: { id: string; state: WaFlowState; isAiEnabled: boolean },
    text: { body: string },
    business: { id: string },
  ): Promise<string> {
    const body = (text?.body || '').trim().toLowerCase();

    if (conv.state === WaFlowState.GREETING) {
      await this.setState(conv.id, WaFlowState.MENU);
      return (
        'Halo! Terima kasih sudah menghubungi. ' +
        'Balas kata kunci *menu*, *harga*, *lokasi*, atau *jam* untuk info cepat.'
      );
    }

    const rules: Record<string, string> = {
      harga: 'Harga mulai Rp50.000. Ketik *lokasi* atau tulis kebutuhan Anda utk detail.',
      lokasi: 'Kami di Jl. Makmur No. 12. Buka otomatis di Google Maps.',
      jam: 'Buka 08.00–21.00 WIB setiap hari.',
      menu: 'Layanan: konsultasi, paket hemat, layanan premium. Ketik *harga* utk rincian.',
    };
    for (const [key, reply] of Object.entries(rules)) {
      if (body.includes(key)) return reply;
    }

    if (conv.isAiEnabled) {
      const reply = await this.tryAiReply(business.id, text.body);
      if (reply) {
        await this.prisma.waConversation.update({
          where: { id: conv.id },
          data: { lastAi: true },
        });
        return reply;
      }
    }

    return 'Tim kami akan segera membalas pesan Anda. Terima kasih!';
  }

  private async tryAiReply(businessId: string, text: string): Promise<string | null> {
    void businessId;
    try {
      const result = await this.ai.complete(
        `Anda admin WhatsApp sebuah bisnis. Jawab singkat & ramah.\nPertanyaan: "${text}"`,
        { temperature: 0.5, feature: 'wa_auto_reply' },
      );
      return result.content.trim() || null;
    } catch (e) {
      this.logger.error('AI reply gagal, fallback ke default', e);
      return null;
    }
  }

  private async setState(id: string, state: WaFlowState) {
    await this.prisma.waConversation.update({ where: { id }, data: { state } });
  }

  // ==================== KIRIM ====================

  private async sendText(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    text: string,
  ) {
    const url = `https://graph.facebook.com/${this.graphVersion}/${phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new BadRequestException(`Meta API error: ${res.status} ${detail}`);
    }
    return res.json();
  }
}