import { z } from 'zod';

// Request OTP Schema
export const RequestOTPSchema = z.object({
  phone: z.string().min(10).max(15).describe('Phone number in international format (e.g., +521234567890)')
});

export const RequestOTPResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
});

// Verify OTP Schema
export const VerifyOTPSchema = z.object({
  phone: z.string().min(10).max(15).describe('Phone number in international format'),
  code: z.string().length(6).describe('6-digit OTP code')
});

export const RecoveryDataSchema = z.object({
  merchantShare: z.string().describe('Primary Shamir share for merchant device'),
  merchantBackupShare: z.string().describe('Backup Shamir share for merchant'),
  recoveryQR: z.string().describe('QR code data for primary share'),
  recoveryEmail: z.string().describe('Recovery data to send via email')
}).optional();

export const VerifyOTPResponseSchema = z.object({
  token: z.string().describe('JWT authentication token'),
  user: z.object({
    id: z.string().uuid(),
    phone: z.string(),
    wallet_addresses: z.array(z.string()).describe('List of wallet addresses')
  }),
  recovery: RecoveryDataSchema.describe('Recovery shares (only provided for new users)')
});

// Profile Schema
export const ProfileResponseSchema = z.object({
  id: z.string().uuid(),
  phone: z.string(),
  wallet_addresses: z.array(z.string()).describe('List of wallet addresses'),
  created_at: z.string().datetime()
});
