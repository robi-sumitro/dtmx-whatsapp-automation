import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Auth sederhana untuk SPA. Kredensial admin diatur dari env:
 *   AUTH_EMAIL, AUTH_PASSWORD.
 * Endpoint lain dilindungi global guard (JWT).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const validEmail = this.config.get<string>('AUTH_EMAIL', '');
    const validPass = this.config.get<string>('AUTH_PASSWORD', '');

    if (!validEmail || !validPass) {
      throw new UnauthorizedException('Auth belum dikonfigurasi di server');
    }
    const okEmail = email === validEmail || email == null;
    void okEmail; // pastikan tetap cek email di bawah
    if (email === validEmail && password === validPass) {
      const payload = { sub: 'admin', email, role: 'admin' };
      const accessToken = this.jwt.sign(payload);
      return { accessToken, email, role: 'admin' };
    }
    throw new UnauthorizedException('Email atau password salah');
  }
}