import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import { dbConnect } from '@/lib/dbConnect';
import SessionActivity from '@/models/SessionActivity';
import { markTimedOutSessions, ONLINE_WINDOW_MS } from '@/lib/session-activity';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    await markTimedOutSessions();

    const decoded = getAuthToken(req);
    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'super_admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date();
    const onlineThreshold = new Date(now.getTime() - ONLINE_WINDOW_MS);

    const activeSessions = await SessionActivity.find({
      isActive: true,
      lastSeenAt: { $gte: onlineThreshold },
    })
      .populate('userId', 'name email role')
      .populate('organizationId', 'name')
      .sort({ lastSeenAt: -1 })
      .limit(200)
      .lean();

    const recentSessions = await SessionActivity.find({})
      .populate('userId', 'name email role')
      .populate('organizationId', 'name')
      .sort({ loginAt: -1 })
      .limit(500)
      .lean();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [totalActiveNow, todayLogins, todayLogouts] = await Promise.all([
      SessionActivity.countDocuments({
        isActive: true,
        lastSeenAt: { $gte: onlineThreshold },
      }),
      SessionActivity.countDocuments({
        loginAt: { $gte: todayStart },
      }),
      SessionActivity.countDocuments({
        logoutAt: { $gte: todayStart },
      }),
    ]);

    return NextResponse.json({
      summary: {
        onlineUsers: totalActiveNow,
        todayLogins,
        todayLogouts,
        onlineWindowMs: ONLINE_WINDOW_MS,
      },
      activeSessions,
      recentSessions,
    });
  } catch (error) {
    console.error('Error fetching session activity:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
