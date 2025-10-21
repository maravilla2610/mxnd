import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { AuthService } from '../../services/auth.service.ts';
import {
  RequestOTPSchema,
  RequestOTPResponseSchema,
  VerifyOTPSchema,
  VerifyOTPResponseSchema,
  ProfileResponseSchema
} from '../../schemas/auth.schemas.ts';
import { ErrorResponseSchema } from '../../schemas/error.schemas.ts';

const authRoutes = new OpenAPIHono();

// Request OTP Route
const requestOTPRoute = createRoute({
  method: 'post',
  path: '/request-otp',
  tags: ['Authentication'],
  summary: 'Request OTP for phone login',
  description: 'Send a 6-digit OTP code to the merchant\'s phone number via SMS',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RequestOTPSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'OTP sent successfully',
      content: {
        'application/json': {
          schema: RequestOTPResponseSchema
        }
      }
    },
    400: {
      description: 'Invalid phone number',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    },
    500: {
      description: 'Server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

authRoutes.openapi(requestOTPRoute, async (c) => {
  try {
    const { phone } = c.req.valid('json');

    if (!phone) {
      return c.json({
        error: 'MISSING_PHONE',
        message: 'Phone number is required'
      }, 400);
    }

    const result = await AuthService.requestOTP(phone);
    return c.json(result, 200);
  } catch (error: any) {
    return c.json({
      error: 'OTP_REQUEST_FAILED',
      message: error.message || 'Failed to request OTP',
      details: error
    }, 500);
  }
});

// Verify OTP Route
const verifyOTPRoute = createRoute({
  method: 'post',
  path: '/verify-otp',
  tags: ['Authentication'],
  summary: 'Verify OTP and login/register',
  description: 'Verify the OTP code. Creates a new wallet with Shamir secret sharing for new users. Returns recovery shares that must be stored by the client.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: VerifyOTPSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'OTP verified, user authenticated. Recovery shares provided for new users.',
      content: {
        'application/json': {
          schema: VerifyOTPResponseSchema
        }
      }
    },
    400: {
      description: 'Missing credentials',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    },
    401: {
      description: 'Invalid OTP',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

authRoutes.openapi(verifyOTPRoute, async (c) => {
  try {
    const { phone, code } = c.req.valid('json');

    if (!phone || !code) {
      return c.json({
        error: 'MISSING_CREDENTIALS',
        message: 'Phone number and code are required'
      }, 400);
    }

    const result = await AuthService.verifyOTP(phone, code);
    return c.json(result, 200);
  } catch (error: any) {
    return c.json({
      error: 'VERIFICATION_FAILED',
      message: error.message || 'Failed to verify OTP',
      details: error
    }, 401);
  }
});

// Get Profile Route
const getProfileRoute = createRoute({
  method: 'get',
  path: '/profile',
  tags: ['Authentication'],
  summary: 'Get user profile',
  description: 'Retrieve the current user\'s profile information',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'User profile',
      content: {
        'application/json': {
          schema: ProfileResponseSchema
        }
      }
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

authRoutes.openapi(getProfileRoute, async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        error: 'UNAUTHORIZED',
        message: 'Authorization token is required'
      }, 401);
    }

    const token = authHeader.substring(7);
    const userId = AuthService.verifyToken(token);

    const profile = await AuthService.getUserProfile(userId);
    return c.json(profile, 200);
  } catch (error: any) {
    return c.json({
      error: 'PROFILE_FETCH_FAILED',
      message: error.message || 'Failed to fetch profile',
      details: error
    }, 401);
  }
});

export default authRoutes;
