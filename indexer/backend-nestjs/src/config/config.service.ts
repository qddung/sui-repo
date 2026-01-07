import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL', '');
  }

  get jwtSecret(): string {
    return this.configService.get<string>(
      'JWT_SECRET',
      'your-secret-key-change-in-production',
    );
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '15m');
  }

  get refreshTokenExpiresIn(): string {
    return this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN', '7d');
  }

  get sessionMaxAge(): number {
    return parseInt(
      this.configService.get<string>('SESSION_MAX_AGE', '86400000'),
      10,
    );
  }

  get ephemeralKeyExpiresIn(): number {
    return parseInt(
      this.configService.get<string>('EPHEMERAL_KEY_EXPIRES_IN', '1800000'),
      10,
    );
  }

  get suiNetwork(): string {
    return this.configService.get<string>('SUI_NETWORK', 'testnet');
  }

  get suiPackageId(): string {
    return this.configService.get<string>('SUI_PACKAGE_ID', '');
  }

  get suiClockObjectId(): string {
    return this.configService.get<string>('SUI_CLOCK_OBJECT_ID', '0x6');
  }

  get port(): number {
    return parseInt(this.configService.get<string>('PORT', '3001'), 10);
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get corsOrigin(): string {
    return this.configService.get<string>(
      'CORS_ORIGIN',
      'http://localhost:3000',
    );
  }

  get encryptionKey(): string {
    return this.configService.get<string>('ENCRYPTION_KEY', '');
  }
}

