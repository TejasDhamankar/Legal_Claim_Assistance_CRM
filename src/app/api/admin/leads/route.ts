import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from '@/lib/auth';
import Lead from '@/models/Lead';
import { dbConnect } from '@/lib/dbConnect';

const parseDateOnly = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
};

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const userId = decoded.id;
    const userRole = decoded.role;

    if (!['admin', 'super_admin'].includes(userRole as string)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Get query parameters for potential filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const createdBy = searchParams.get('createdBy');
    const buyerCode = searchParams.get('buyerCode');
    const entryDate = searchParams.get('entryDate');

    // Build query
    const query: any = {};
    if (status && status !== 'All') {
      query.status = status;
    }
    if (buyerCode) {
      query.buyerCode = buyerCode;
    }
    if (entryDate) {
      const parsed = parseDateOnly(entryDate);
      if (parsed) {
        const start = new Date(parsed.year, parsed.month - 1, parsed.day, 0, 0, 0, 0);
        const end = new Date(parsed.year, parsed.month - 1, parsed.day, 23, 59, 59, 999);
        query.createdAt = { $gte: start, $lte: end };
      }
    }
    if (userRole === 'admin') {
      query.createdBy = userId;
    } else if (createdBy) {
      query.createdBy = createdBy;
    }

    const leads = await Lead.find(query)
      .select('firstName lastName email phone status applicationType createdAt buyerCode createdBy')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
