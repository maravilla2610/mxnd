import { Hono } from 'hono';
import { AuthService } from '../services/auth.service.ts';
import type { ErrorResponse } from '../types/index.ts';

const authRoutes = new Hono();

/**
 * POST /api/v1/auth/request-otp
 * Request OTP for phone number
 */
authRoutes.post('/request-otp', async (c) => {
  try {
    const body = await c.req.json();
    const { phone } = body;

    if (!phone) {
      const errorResponse: ErrorResponse = {
        error: 'MISSING_PHONE',
        message: 'Phone number is required'
      };
      return c.json(errorResponse, 400);
    }

    const result = await AuthService.requestOTP(phone);
    return c.json(result);
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'OTP_REQUEST_FAILED',
      message: error.message || 'Failed to request OTP',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});

/**
 * POST /api/v1/auth/verify-otp
 * Verify OTP and login/register user
 */
authRoutes.post('/verify-otp', async (c) => {
  try {
    const body = await c.req.json();
    const { phone, code } = body;

    if (!phone || !code) {
      const errorResponse: ErrorResponse = {
        error: 'MISSING_CREDENTIALS',
        message: 'Phone number and code are required'
      };
      return c.json(errorResponse, 400);
    }

    const result = await AuthService.verifyOTP(phone, code);
    return c.json(result);
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'VERIFICATION_FAILED',
      message: error.message || 'Failed to verify OTP',
      details: error
    };
    return c.json(errorResponse, 401);
  }
});

/**
 * GET /api/v1/auth/profile
 * Get current user profile
 */
authRoutes.get('/profile', async (c) => {
  try {
    // Extract token from Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const errorResponse: ErrorResponse = {
        error: 'UNAUTHORIZED',
        message: 'Authorization token is required'
      };
      return c.json(errorResponse, 401);
    }

    const token = authHeader.substring(7);
    const userId = AuthService.verifyToken(token);

    const profile = await AuthService.getUserProfile(userId);
    return c.json(profile);
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'PROFILE_FETCH_FAILED',
      message: error.message || 'Failed to fetch profile',
      details: error
    };
    return c.json(errorResponse, 401);
  }
});

export default authRoutes;
