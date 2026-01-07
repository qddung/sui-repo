import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '../../config/config.service';
import { JWTPayload, SessionData } from '../../types';

@Injectable()
export class JwtService {
  constructor(
    private jwtService: NestJwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate JWT access token
   */
  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.jwtExpiresIn,
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(sessionId: string): string {
    return this.jwtService.sign(
      { sessionId, type: 'refresh' },
      {
        expiresIn: this.configService.refreshTokenExpiresIn,
      },
    );
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      return this.jwtService.verify<JWTPayload>(token, {
        secret: this.configService.jwtSecret,
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Create JWT payload from session data
   */
  createJWTPayload(
    sessionData: SessionData,
    sessionId: string,
    ephemeralKeyId?: string,
    scope?: string[],
  ): Omit<JWTPayload, 'iat' | 'exp'> {
    return {
      sub: sessionData.userId,
      wal: sessionData.walletAddress,
      sid: sessionId,
      ekey: ephemeralKeyId,
      scope: scope?.join(','),
    };
  }
}

