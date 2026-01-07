import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class CryptoService {
  constructor(private configService: ConfigService) {}

  /**
   * Encrypt sensitive data (e.g., ephemeral private keys)
   * Uses AES-256-GCM for authenticated encryption
   */
  encrypt(plaintext: string): string {
    const encryptionKey = this.configService.encryptionKey;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY not configured');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(encryptionKey, 'hex').slice(0, 32),
      iv,
    );

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Combine IV + authTag + encrypted data
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    const encryptionKey = this.configService.encryptionKey;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY not configured');
    }

    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(encryptionKey, 'hex').slice(0, 32),
      Buffer.from(ivHex, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash refresh token for storage
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate secure random nonce for wallet authentication
   */
  generateNonce(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify signature (for Sui wallet signatures)
   * This is a placeholder - implement actual Sui signature verification
   */
  verifySignature(
    message: string,
    signature: string,
    publicKey: string,
  ): boolean {
    // TODO: Implement Sui signature verification
    // This should use @mysten/sui.js or similar
    throw new Error('Signature verification not implemented');
  }
}

