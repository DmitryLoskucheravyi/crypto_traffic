import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import * as jwt from 'jsonwebtoken';

export const SESSION_COOKIE = 'session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class AuthService {
  constructor(private readonly config: ConfigService) {}

  validateCredentials(username: string, password: string): boolean {
    const expectedUsername = this.config.getOrThrow<string>('adminUsername');
    const expectedPassword = this.config.getOrThrow<string>('adminPassword');
    return this.safeCompare(username, expectedUsername) && this.safeCompare(password, expectedPassword);
  }

  issueToken(): string {
    const secret = this.config.getOrThrow<string>('sessionSecret');
    return jwt.sign({ role: 'admin' }, secret, { expiresIn: SESSION_TTL_SECONDS });
  }

  get cookieMaxAgeMs(): number {
    return SESSION_TTL_SECONDS * 1000;
  }

  verifyToken(token: string): boolean {
    const secret = this.config.getOrThrow<string>('sessionSecret');
    try {
      jwt.verify(token, secret);
      return true;
    } catch {
      return false;
    }
  }

  // Порівнює через sha256+timingSafeEqual, щоб не витікала довжина/вміст пароля через час відповіді.
  private safeCompare(a: string, b: string): boolean {
    const bufA = createHash('sha256').update(a).digest();
    const bufB = createHash('sha256').update(b).digest();
    return timingSafeEqual(bufA, bufB);
  }
}
