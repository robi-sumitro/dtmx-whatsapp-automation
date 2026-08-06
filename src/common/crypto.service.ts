import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly algorithm = 'aes-256-gcm';

  constructor(private readonly config: ConfigService) {}

  private get key(): Buffer {
    const secret = this.config.get<string>('APP_ENCKEY', '');
    const material = Buffer.from(secret || 'dev-only-fallback-key!');
    return crypto.createHash('sha256').update(material).digest();
  }

  encrypt(plain: string): string {
    if (plain == null) return plain;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv, tag, enc].map((b) => b.toString('base64url')).join('.');
  }

  decrypt(token: string): string {
    if (token == null) return token;
    const [ivB64, tagB64, dataB64] = token.split('.');
    try {
      const iv = Buffer.from(ivB64, 'base64url');
      const tag = Buffer.from(tagB64, 'base64url');
      const data = Buffer.from(dataB64, 'base64url');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    } catch (e) {
      this.logger.error('Gagal mendekripsi token WhatsApp');
      throw new Error('Token tidak dapat didekripsi.');
    }
  }
}