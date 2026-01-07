import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { CreateChildWalletDto } from './dto/create-child-wallet.dto';
import { SignTransactionDto } from './dto/sign.dto';
import { EphemeralKeyScope } from '../types';

@Injectable()
export class ChildWalletService {
  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
  ) {}

  async createChildWallet(sessionId: string, dto: CreateChildWalletDto) {
    const { scope, expiresInHours = 24 } = dto;

    if (!scope || !Array.isArray(scope)) {
      throw new BadRequestException(
        'Scope array is required (e.g., ["room:create", "room:join"])',
      );
    }

    const validScopes: EphemeralKeyScope[] = [
      'room:create',
      'room:approve',
      'room:revoke',
      'room:join',
      'room:leave',
      'poap:mint',
    ];

    const invalidScopes = scope.filter(
      (s: string) => !validScopes.includes(s as EphemeralKeyScope),
    );
    if (invalidScopes.length > 0) {
      throw new BadRequestException(
        `Invalid scopes: ${invalidScopes.join(', ')}`,
      );
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== 'active' || session.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired session');
    }

    // Generate ephemeral keypair (child wallet)
    const ephemeralKeypair = new Ed25519Keypair();
    const publicKey = ephemeralKeypair.getPublicKey().toSuiAddress();
    const privateKeyBytes = ephemeralKeypair.getSecretKey();
    const privateKeyBase64 = Buffer.from(privateKeyBytes).toString('base64');

    // Encrypt private key for storage
    const encryptedPrivateKey = this.cryptoService.encrypt(privateKeyBase64);

    // Calculate expiration
    const expiresAt = new Date(
      Date.now() + expiresInHours * 60 * 60 * 1000,
    );

    // Store ephemeral key
    const ephemeralKey = await this.prisma.ephemeralKey.create({
      data: {
        sessionId: session.id,
        publicKey,
        encryptedPublicKey: this.cryptoService.encrypt(publicKey),
        alg: 'ed25519',
        scope: scope.join(','),
        expiresAt,
      },
    });

    // Also update session with encrypted private key for convenience
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        encryptedPrivateKey,
        lastUsedAt: new Date(),
      },
    });

    return {
      childWallet: {
        id: ephemeralKey.id,
        address: publicKey,
        scope,
        expiresAt,
        issuedAt: ephemeralKey.issuedAt,
      },
      message:
        'Child wallet created successfully. Use this address for auto-signing within allowed scopes.',
    };
  }

  async listChildWallets(sessionId: string) {
    const ephemeralKeys = await this.prisma.ephemeralKey.findMany({
      where: {
        sessionId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return {
      childWallets: ephemeralKeys.map((key) => ({
        id: key.id,
        address: key.publicKey,
        scope: key.scope.split(','),
        issuedAt: key.issuedAt,
        expiresAt: key.expiresAt,
      })),
    };
  }

  async signTransaction(sessionId: string, dto: SignTransactionDto) {
    const { ephemeralKeyId, txPayload, requestedScope } = dto;

    // Find ephemeral key
    const ephemeralKey = await this.prisma.ephemeralKey.findFirst({
      where: {
        id: ephemeralKeyId,
        sessionId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!ephemeralKey) {
      throw new NotFoundException('Child wallet not found or expired');
    }

    // Verify scope permission
    const allowedScopes = ephemeralKey.scope.split(',');
    if (requestedScope && !allowedScopes.includes(requestedScope)) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requestedScope}, Allowed: ${allowedScopes.join(', ')}`,
      );
    }

    // Retrieve and decrypt private key from session
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session?.encryptedPrivateKey) {
      throw new NotFoundException('Child wallet private key not found');
    }

    const privateKeyBase64 = this.cryptoService.decrypt(
      session.encryptedPrivateKey,
    );
    const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');

    // Reconstruct keypair
    const ephemeralKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);

    // Sign transaction
    const txBytes = Buffer.from(txPayload, 'base64');
    const signature = await ephemeralKeypair.sign(txBytes);

    // Log the delegated signature for audit trail
    await this.prisma.delegatedSignature.create({
      data: {
        sessionId,
        txTemplateHash: Buffer.from(txBytes.slice(0, 32)).toString('hex'),
        signature: Buffer.from(signature).toString('base64'),
        scope: requestedScope || 'auto-sign',
        expiresAt: ephemeralKey.expiresAt,
      },
    });

    return {
      signature: Buffer.from(signature).toString('base64'),
      publicKey: ephemeralKey.publicKey,
      signedAt: new Date().toISOString(),
    };
  }

  async revokeChildWallet(sessionId: string, id: string) {
    const ephemeralKey = await this.prisma.ephemeralKey.findFirst({
      where: {
        id,
        sessionId,
      },
    });

    if (!ephemeralKey) {
      throw new NotFoundException('Child wallet not found');
    }

    await this.prisma.ephemeralKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return { message: 'Child wallet revoked successfully' };
  }
}

