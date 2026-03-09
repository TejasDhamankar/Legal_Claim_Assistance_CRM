import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from '@/lib/auth';
import Lead from '@/models/Lead';
import { dbConnect } from '@/lib/dbConnect';

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

    // Build query
    const query: any = {};
    if (status && status !== 'All') {
      query.status = status;
    }
    if (buyerCode) {
      query.buyerCode = buyerCode;
    }
    if (userRole === 'admin') {
      query.createdBy = userId;
    } else if (createdBy) {
      query.createdBy = createdBy;
    }

    const leadsRaw = await Lead.find(query)
      .select('firstName lastName email phone status applicationType createdAt buyerCode createdBy notes')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const leads = leadsRaw.map((lead: any) => ({
      ...lead,
      createdByDisplay:
        typeof lead.notes === 'string' && lead.notes.includes('[PUBLIC INTAKE]')
          ? 'Public Link'
          : lead.createdBy?.name || 'System',
    }));

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
