import { NextRequest, NextResponse } from 'next/server';
import { generateToken, comparePassword } from '@/lib/auth';
import User from '@/models/User';
import { dbConnect } from '@/lib/dbConnect';
import {
  createSessionId,
  ensureSessionHeartbeat,
  getRequestIp,
  setSessionCookie,
} from '@/lib/session-activity';

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (user.active === false) {
      return NextResponse.json(
        { error: 'Your account is inactive. Please contact an administrator.' },
        { status: 403 }
      );
    }

    // Create user object with proper ID format
    const userData = {
      id: user._id.toString(), // Use string ID
      email: user.email,
      role: user.role
    };

    const token = generateToken(userData);

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      { status: 200 }
    );

    const now = new Date();
    const sessionId = createSessionId();
    const ip = getRequestIp(req);

    try {
      await ensureSessionHeartbeat({
        userId: user._id.toString(),
        organizationId: user.organizationId?.toString(),
        sessionId,
        ip,
        userAgent: req.headers.get('user-agent') || undefined,
        now,
      });

      user.lastLogin = now;
      await user.save();
    } catch (sessionError) {
      console.error('Session tracking failed during login:', sessionError);
      // Do not block authentication if activity tracking fails.
    }

    // Set the auth cookie with proper options
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 1 * 24 * 60 * 60, // 1 day in seconds
      path: '/',
      sameSite: 'lax'
    });
    setSessionCookie(response, sessionId);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
