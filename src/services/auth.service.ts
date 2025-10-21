import prisma from '../../prisma/client.ts';
import { WalletService } from './wallet.service.ts';
import { KeyShareService } from './key-share.service.ts';
import { Buffer } from 'node:buffer';

// In-memory OTP storage for demo (use Redis in production)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export class AuthService {
  /**
   * Request OTP for phone number
   * In production, integrate with Twilio or similar SMS provider
   */
  static async requestOTP(phone: string): Promise<{ success: boolean; message: string }> {
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 5-minute expiration
    otpStore.set(phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // TODO: Send SMS via Twilio
    console.log(`📱 OTP for ${phone}: ${code}`);

    return {
      success: true,
      message: 'OTP sent'
    };
  }

  /**
   * Verify OTP and login/register user
   */
  static async verifyOTP(phone: string, code: string): Promise<{
    token: string;
    user: {
      id: string;
      phone: string;
      wallet_addresses: { [key: string]: string } | null;
    };
    recovery?: {
      merchantShare: string;
      merchantBackupShare: string;
      recoveryQR: string;
      recoveryEmail: string;
    };
  }> {
    // Verify OTP
    const storedOTP = otpStore.get(phone);

    if (!storedOTP) {
      throw new Error('OTP not found or expired');
    }

    if (storedOTP.expiresAt < Date.now()) {
      otpStore.delete(phone);
      throw new Error('OTP expired');
    }

    if (storedOTP.code !== code) {
      throw new Error('Invalid OTP');
    }

    // Clear OTP after successful verification
    otpStore.delete(phone);

    // Check if user exists
    let user = await prisma.users.findUnique({
      where: { phone },
      include: { wallets: true }
    });

    let recoveryData;

    // If new user, create user and wallet with Shamir shares
    if (!user) {
      // Create wallet with decentralized key management
      const walletData = await WalletService.createWalletForUser();

      // Create user first
      user = await prisma.users.create({
        data: { phone },
        include: { wallets: true }
      });

      // Generate share distribution from the wallet creation
      // Note: In production, you'd want to improve this flow
      const shareDistribution = KeyShareService.generateShareDistribution(
        walletData.merchantShare
      );

      await WalletService.storeWalletWithShares(
        user.id,
        walletData.addresses,
        walletData.primaryAddress,
        shareDistribution.backendShare1,
        shareDistribution.backendShare2,
        shareDistribution.optionalShare
      );

      // Re-fetch user with wallet
      user = await prisma.users.findUnique({
        where: { id: user.id },
        include: { wallets: true }
      }) || user;

      // Return recovery data to client
      recoveryData = {
        merchantShare: walletData.merchantShare,
        merchantBackupShare: walletData.merchantBackupShare,
        recoveryQR: walletData.recoveryQR,
        recoveryEmail: walletData.recoveryEmail
      };

      console.log(`
🔐 NEW WALLET CREATED WITH SHAMIR SECRET SHARING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 Addresses:
   Polygon:   ${walletData.addresses.polygon}
   Ethereum:  ${walletData.addresses.ethereum}
   Avalanche: ${walletData.addresses.avalanche}
   Bitcoin:   ${walletData.addresses.bitcoin}
🔑 Key Management: Shamir (3-of-5 threshold)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    }

    // Generate JWT token (simplified - use proper JWT library in production)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        wallet_addresses: (user.wallets?.chainAddresses as { [key: string]: string } | null) || null
      },
      recovery: recoveryData
    };
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { wallets: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      phone: user.phone,
      wallet_addresses: (user.wallets?.chainAddresses as { [key: string]: string } | null) || null,
      created_at: user.createdAt.toISOString()
    };
  }

  /**
   * Verify token and extract user ID
   */
  static verifyToken(token: string): string {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId] = decoded.split(':');
      return userId;
    } catch {
      throw new Error('Invalid token');
    }
  }
}
