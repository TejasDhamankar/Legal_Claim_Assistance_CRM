import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserType } from '@/types';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1d';
const COOKIE_NAME = 'auth_token';

const requireJwtSecret = () => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }
  return JWT_SECRET;
};

export const verifyToken = (token: string) => {
  try {
    // More explicit decoding with proper typing
    const secret = requireJwtSecret();
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

export const generateToken = (user: Partial<UserType> & { id?: string }) => {
  try {
    // Ensure we're using consistent ID field
    const payload = {
      id: user.id || user._id?.toString(),  // Make sure ID is a string
      email: user.email,
      role: user.role,
    };

    const secret = requireJwtSecret();
    const token = jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN });
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
};

export function getAuthToken(req: NextRequest): jwt.JwtPayload | null {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;

  try {
    const secret = requireJwtSecret();
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    return decoded;
  } catch (err) {
    console.error('[getAuthToken] Invalid token:', err);
    return null;
  }
}


// export const getUserFromRequest = (req?: NextRequest) => {
//   if (!req) return null;
//   const token = getAuthToken(req);
//   if (!token) return null;

//   const decoded = verifyToken(token);
//   return decoded;
// };

export const setAuthCookie = async (token: string, res?: NextResponse) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    maxAge: 1 * 24 * 60 * 60, // 1 day in seconds
    path: '/',
    sameSite: 'lax' as const
  };

  if (res) {
    // For API routes using NextResponse
    res.cookies.set(COOKIE_NAME, token, cookieOptions);
    return res;
  } else {
    // For server components
    const cookiesStore = await cookies();
    cookiesStore.set(COOKIE_NAME, token, cookieOptions);
  }
};

export const clearAuthCookie = async (res?: NextResponse) => {
  if (res) {
    // For API routes
    res.cookies.delete(COOKIE_NAME);
    return res;
  } else {
    // For server components
    const cookiesStore = await cookies();
    cookiesStore.delete(COOKIE_NAME);
  }
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword);
};
