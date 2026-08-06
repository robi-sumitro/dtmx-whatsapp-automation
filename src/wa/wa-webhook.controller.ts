import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { WaService } from './wa.service';
import { Public } from '../common/decorators/auth.decorators';

@Controller('wa/webhook')
export class WaWebhookController {
  constructor(
    private readonly wa: WaService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    return this.wa.verify(challenge as string, mode, token);
  }

  @Public()
  @Post()
  async handle(
    @Headers('x-hub-signature-256') signature: string,
    @Body() body: any,
    @Req() req: any,
    @Res() res: any,
  ) {
    const appSecret = this.config.get<string>('WA_APP_SECRET', '');
    const raw = req.rawBody as Buffer | string | undefined;
    const input = typeof raw === 'string' ? raw : raw?.toString('utf8') ?? JSON.stringify(body);

    if (!appSecret || !signature) {
      throw new BadRequestException('Missing WA_APP_SECRET or signature header');
    }
    const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(input).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      throw new BadRequestException('X-Hub-Signature-256 tidak valid');
    }

    await this.wa.handleIncoming(body);
    return res.status(200).json({ ok: true });
  }
}