import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';
import {
  createSessionId,
  ensureSessionHeartbeat,
  getRequestIp,
  getSessionIdFromRequest,
  markTimedOutSessions,
  ONLINE_WINDOW_MS,
  setSessionCookie,
} from '@/lib/session-activity';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    await markTimedOutSessions();

    const decoded = getAuthToken(req);
    if (!decoded || typeof decoded !== 'object' || !decoded.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(decoded.id).select('_id organizationId');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let sessionId = getSessionIdFromRequest(req);
    let shouldSetCookie = false;
    if (!sessionId) {
      sessionId = createSessionId();
      shouldSetCookie = true;
    }

    const now = new Date();
    await ensureSessionHeartbeat({
      userId: user._id.toString(),
      organizationId: user.organizationId?.toString(),
      sessionId,
      ip: getRequestIp(req),
      userAgent: req.headers.get('user-agent') || undefined,
      now,
    });

    const response = NextResponse.json({
      success: true,
      status: 'online',
      onlineWindowMs: ONLINE_WINDOW_MS,
      lastSeenAt: now.toISOString(),
    });

    if (shouldSetCookie) {
      setSessionCookie(response, sessionId);
    }

    return response;
  } catch (error) {
    console.error('Session heartbeat error:', error);
    return NextResponse.json(
      { error: 'Failed to update session heartbeat' },
      { status: 500 }
    );
  }
}
