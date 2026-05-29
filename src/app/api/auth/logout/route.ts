import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import { dbConnect } from '@/lib/dbConnect';
import { clearAuthCookie } from '@/lib/auth';
import {
  clearSessionCookie,
  closeSession,
  getRequestIp,
  getSessionIdFromRequest,
} from '@/lib/session-activity';

export async function POST(req: NextRequest) {
  await dbConnect();
  const response = NextResponse.json(
    { success: true },
    { status: 200 }
  );

  const decoded = getAuthToken(req);
  if (decoded && typeof decoded === 'object' && decoded.id) {
    await closeSession({
      userId: decoded.id as string,
      sessionId: getSessionIdFromRequest(req),
      ip: getRequestIp(req),
      reason: 'user_logout',
    });
  }

  // Clear the auth cookie
  await clearAuthCookie(response);
  clearSessionCookie(response);

  return response;
}
