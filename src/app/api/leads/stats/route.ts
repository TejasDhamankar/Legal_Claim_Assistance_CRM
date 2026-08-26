// src/app/api/leads/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Lead from '@/models/Lead';
import { getAuthToken } from '@/lib/auth';
import { dbConnect } from '@/lib/dbConnect';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const decoded = getAuthToken(request);
    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: '401' }, { status: 401 });
    }

    const userId = decoded.id as string | undefined;
    const userRole = decoded.role as string | undefined;

    // Aggregation $match does not cast strings → ObjectId; agents/admins must match ObjectId
    let leadFilter: Record<string, unknown> = {};
    if (userRole !== 'super_admin') {
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ error: 'Invalid user' }, { status: 401 });
      }
      leadFilter = { createdBy: new mongoose.Types.ObjectId(userId) };
    }

    const statusCounts = await Lead.aggregate([
      { $match: leadFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const totalLeads = await Lead.countDocuments(leadFilter);

    const lawsuitCounts = await Lead.aggregate([
      { $match: leadFilter },
      {
        $group: {
          _id: { $ifNull: ['$lawsuit', 'Unassigned'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const chartDataRaw = await Lead.aggregate([
      { $match: { ...leadFilter, createdAt: { $gte: twentyFourHoursAgo } } },
      {
        $group: {
          _id: {
            hour: { $hour: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.day': 1, '_id.hour': 1 } },
    ]);

    const chartData = chartDataRaw.map((item) => ({
      name: `${item._id.hour}:00`,
      value: item.count,
    }));

    const recentActivity = await Lead.aggregate([
      { $match: leadFilter },
      { $unwind: '$statusHistory' },
      { $sort: { 'statusHistory.timestamp': -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'statusHistory.changedBy',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          'statusHistory.toStatus': 1,
          'statusHistory.timestamp': 1,
          'user.name': 1,
        },
      },
    ]);

    return NextResponse.json({
      statusCounts,
      totalLeads,
      lawsuitCounts,
      recentActivity,
      chartData: chartData.length > 0 ? chartData : [{ name: 'No Data', value: 0 }],
    });
  } catch (error: any) {
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
