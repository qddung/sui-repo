import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { ConfigService } from '../config/config.service';
import * as crypto from 'crypto';
import { CreateEphemeralKeyDto } from './dto/ephemeral-key.dto';
import { AutoSignDto } from './dto/auto-sign.dto';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private configService: ConfigService,
  ) {}

  async createEphemeralKey(sessionId: string, dto: CreateEphemeralKeyDto) {
    const { scope = ['room:create', 'room:approve'] } = dto;

    // Generate ephemeral key pair (Ed25519)
    const keyPair = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const publicKey = keyPair.publicKey;
    const privateKey = keyPair.privateKey;

    // Encrypt private key
    const encryptedPrivateKey = this.cryptoService.encrypt(privateKey);

    // Store ephemeral key
    const expiresAt = new Date(
      Date.now() + this.configService.ephemeralKeyExpiresIn,
    );
    const ephemeralKey = await this.prisma.ephemeralKey.create({
      data: {
        sessionId,
        publicKey,
        alg: 'ed25519',
        scope: scope.join(','),
        expiresAt,
      },
    });

    // Update session with encrypted private key
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        encryptedPrivateKey,
        lastUsedAt: new Date(),
      },
    });

    return {
      ephemeralKeyId: ephemeralKey.id,
      publicKey,
      expiresAt: ephemeralKey.expiresAt,
      scope: ephemeralKey.scope.split(','),
    };
  }

  async autoSign(sessionId: string, dto: AutoSignDto) {
    const { txPayload, scope } = dto;

    // Get session with ephemeral key
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        ekeys: {
          where: {
            expiresAt: { gt: new Date() },
            revokedAt: null,
          },
          orderBy: { expiresAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!session || !session.encryptedPrivateKey) {
      throw new NotFoundException('No active ephemeral key found');
    }

    const ephemeralKey = session.ekeys[0];
    if (!ephemeralKey) {
      throw new NotFoundException('No valid ephemeral key');
    }

    // Check scope
    const requiredScopes = Array.isArray(scope) ? scope : [scope];
    const keyScopes = ephemeralKey.scope.split(',');
    const hasScope = requiredScopes.every((s) => keyScopes.includes(s));

    if (!hasScope) {
      throw new ForbiddenException('Insufficient scope');
    }

    // Decrypt private key
    const privateKey = this.cryptoService.decrypt(session.encryptedPrivateKey);

    // TODO: Sign transaction using Sui SDK
    // const signature = signTransaction(txPayload, privateKey);

    // For now, return mock signature
    const signature = crypto
      .sign(null, Buffer.from(txPayload), privateKey)
      .toString('base64');

    return {
      signature,
      publicKey: ephemeralKey.publicKey,
      ephemeralKeyId: ephemeralKey.id,
    };
  }

  async getSessionInfo(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
        wallet: true,
        ekeys: {
          where: {
            expiresAt: { gt: new Date() },
            revokedAt: null,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      session: {
        id: session.id,
        status: session.status,
        expiresAt: session.expiresAt,
        lastUsedAt: session.lastUsedAt,
      },
      user: {
        id: session.user.id,
        walletAddress: session.wallet.address,
      },
      ephemeralKeys: session.ekeys.map((ek) => ({
        id: ek.id,
        scope: ek.scope.split(','),
        expiresAt: ek.expiresAt,
      })),
    };
  }
}

