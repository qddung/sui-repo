import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { JwtService } from '../common/jwt/jwt.service';
import { ConfigService } from '../config/config.service';
import * as crypto from 'crypto';
import { VerifySignatureDto } from './dto/verify.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateNonce(walletAddress: string) {
    const nonce = this.cryptoService.generateNonce();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.authNonce.create({
      data: {
        walletAddress,
        nonce,
        expiresAt,
      },
    });

    return { nonce, expiresAt };
  }

  async verifySignature(dto: VerifySignatureDto) {
    const { walletAddress, signature, walletType = 'sui' } = dto;

    // Find and consume nonce
    const nonceRecord = await this.prisma.authNonce.findFirst({
      where: {
        walletAddress,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!nonceRecord) {
      throw new BadRequestException('Invalid or expired nonce');
    }

    // TODO: Verify signature using Sui SDK
    // const isValid = this.cryptoService.verifySignature(nonceRecord.nonce, signature, walletAddress);
    // if (!isValid) {
    //   throw new BadRequestException('Invalid signature');
    // }

    // Mark nonce as consumed
    await this.prisma.authNonce.update({
      where: { id: nonceRecord.id },
      data: { consumedAt: new Date() },
    });

    // Find or create user
    let user = await this.prisma.user.findFirst({
      where: { primaryWalletAddress: walletAddress },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { primaryWalletAddress: walletAddress },
      });
    }

    // Find or create wallet
    let wallet = await this.prisma.wallet.findUnique({
      where: { address: walletAddress },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId: user.id,
          address: walletAddress,
          type: walletType,
        },
      });
    }

    // Create session
    const expiresAt = new Date(
      Date.now() + this.configService.sessionMaxAge,
    );
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        walletId: wallet.id,
        jwtId: crypto.randomUUID(),
        expiresAt,
        status: 'active',
      },
    });

    // Create refresh token
    const refreshToken = this.jwtService.generateRefreshToken(session.id);
    const refreshTokenHash = this.cryptoService.hashToken(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        sessionId: session.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(
          Date.now() +
            parseInt(this.configService.refreshTokenExpiresIn) * 1000,
        ),
      },
    });

    // Generate access token
    const jwtPayload = this.jwtService.createJWTPayload(
      {
        userId: user.id,
        walletId: wallet.id,
        walletAddress: wallet.address,
        walletType: wallet.type as 'sui' | 'zklogin',
      },
      session.id,
    );

    const accessToken = this.jwtService.generateAccessToken(jwtPayload);

    return {
      accessToken,
      refreshToken,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
      user: {
        id: user.id,
        walletAddress: wallet.address,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    const refreshTokenHash = this.cryptoService.hashToken(refreshToken);

    // Find refresh token record
    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: refreshTokenHash },
      include: {
        session: {
          include: {
            user: true,
            wallet: true,
          },
        },
      },
    });

    if (
      !tokenRecord ||
      tokenRecord.revokedAt ||
      tokenRecord.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired refresh token');
    }

    // Check if session is still active
    if (
      tokenRecord.session.status !== 'active' ||
      tokenRecord.session.expiresAt < new Date()
    ) {
      throw new BadRequestException('Session expired');
    }

    // Generate new access token
    const jwtPayload = this.jwtService.createJWTPayload(
      {
        userId: tokenRecord.session.userId,
        walletId: tokenRecord.session.walletId,
        walletAddress: tokenRecord.session.wallet.address,
        walletType: tokenRecord.session.wallet.type as 'sui' | 'zklogin',
      },
      tokenRecord.session.id,
    );

    const accessToken = this.jwtService.generateAccessToken(jwtPayload);

    // Update session last used
    await this.prisma.session.update({
      where: { id: tokenRecord.sessionId },
      data: { lastUsedAt: new Date() },
    });

    return { accessToken };
  }
}

