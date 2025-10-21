import secrets from 'secrets.js-34r7h';
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'node:crypto';
import { Buffer } from 'node:buffer';

/**
 * Service for managing decentralized key storage using Shamir's Secret Sharing
 *
 * Architecture:
 * - Total shares: 5
 * - Threshold: 3 (need 3 shares to reconstruct)
 * - Distribution:
 *   - Share 1: Merchant's device (local storage/secure enclave)
 *   - Share 2: Merchant's backup (email/cloud encrypted)
 *   - Share 3: Backend encrypted storage
 *   - Share 4: Backend encrypted storage (redundancy)
 *   - Share 5: Optional - Hardware wallet or third-party custody
 */

export class KeyShareService {
  private static readonly TOTAL_SHARES = 5;
  private static readonly THRESHOLD = 3;

  /**
   * Split a seed phrase into Shamir shares
   * @param seedPhrase - BIP39 seed phrase to split
   * @returns Array of share strings
   */
  static splitSeedPhrase(seedPhrase: string): string[] {
    // Convert seed phrase to hex
    const hexSeed = Buffer.from(seedPhrase, 'utf8').toString('hex');

    // Generate shares using Shamir's Secret Sharing
    const shares = secrets.share(hexSeed, this.TOTAL_SHARES, this.THRESHOLD);

    return shares;
  }

  /**
   * Reconstruct seed phrase from shares
   * @param shares - Array of at least THRESHOLD shares
   * @returns Reconstructed seed phrase
   */
  static reconstructSeedPhrase(shares: string[]): string {
    if (shares.length < this.THRESHOLD) {
      throw new Error(`Need at least ${this.THRESHOLD} shares to reconstruct seed phrase`);
    }

    // Combine shares to reconstruct the secret
    const hexSeed = secrets.combine(shares.slice(0, this.THRESHOLD));

    // Convert hex back to seed phrase
    const seedPhrase = Buffer.from(hexSeed, 'hex').toString('utf8');

    return seedPhrase;
  }

  /**
   * Encrypt a share for storage
   * @param share - Share to encrypt
   * @param shareIndex - Index of the share (for salt derivation)
   * @returns Encrypted share
   */
  static encryptShare(share: string, shareIndex: number): string {
    const secret = Deno.env.get('ENCRYPTION_KEY') || 'default-secret-key-change-in-production';
    const salt = `share-${shareIndex}-salt`;
    const key = scryptSync(secret, salt, 32);
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(share, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt a share from storage
   * @param encryptedShare - Encrypted share
   * @param shareIndex - Index of the share (for salt derivation)
   * @returns Decrypted share
   */
  static decryptShare(encryptedShare: string, shareIndex: number): string {
    const secret = Deno.env.get('ENCRYPTION_KEY') || 'default-secret-key-change-in-production';
    const salt = `share-${shareIndex}-salt`;
    const key = scryptSync(secret, salt, 32);

    const [ivHex, encrypted] = encryptedShare.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate share distribution for a merchant wallet
   * @param seedPhrase - The wallet seed phrase
   * @returns Object with shares distributed across different storage locations
   */
  static generateShareDistribution(seedPhrase: string): {
    merchantShare: string; // Share 1: For merchant's device
    merchantBackupShare: string; // Share 2: For merchant's backup
    backendShare1: string; // Share 3: Backend encrypted storage
    backendShare2: string; // Share 4: Backend encrypted storage (redundancy)
    optionalShare: string; // Share 5: Optional third-party custody
    allShares: string[]; // All shares for emergency recovery
  } {
    const shares = this.splitSeedPhrase(seedPhrase);

    return {
      merchantShare: shares[0], // Merchant keeps this
      merchantBackupShare: shares[1], // Sent to merchant's email (encrypted)
      backendShare1: this.encryptShare(shares[2], 2), // Encrypted in DB
      backendShare2: this.encryptShare(shares[3], 3), // Encrypted in DB (redundancy)
      optionalShare: shares[4], // Could be stored with third-party KMS
      allShares: shares
    };
  }

  /**
   * Validate that shares can reconstruct the original seed
   * @param shares - Shares to validate
   * @param originalSeed - Original seed phrase
   * @returns true if valid
   */
  static validateShares(shares: string[], originalSeed: string): boolean {
    try {
      const reconstructed = this.reconstructSeedPhrase(shares);
      return reconstructed === originalSeed;
    } catch {
      return false;
    }
  }

  /**
   * Create a recovery package for the merchant
   * This can be sent via email or displayed as a QR code
   */
  static createRecoveryPackage(merchantShare: string, merchantBackupShare: string): {
    qrData: string;
    emailData: string;
  } {
    const recoveryData = {
      shares: [merchantShare, merchantBackupShare],
      timestamp: Date.now(),
      version: '1.0'
    };

    return {
      qrData: JSON.stringify({ share: merchantShare }), // QR for primary share
      emailData: JSON.stringify(recoveryData) // Full recovery data for email
    };
  }
}
