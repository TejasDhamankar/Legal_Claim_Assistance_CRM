import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import Lead from '@/models/Lead';
import { dbConnect } from '@/lib/dbConnect';

/** Admin / super_admin: set buyer code on any lead they can access */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    await dbConnect();

    const decoded = getAuthToken(request);
    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!['admin', 'super_admin'].includes(decoded.role as string)) {
      return NextResponse.json(
        { message: 'Only admins can update buyer codes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const buyerCode =
      typeof body.buyerCode === 'string' ? body.buyerCode.trim().toUpperCase() : '';

    if (!buyerCode) {
      return NextResponse.json({ message: 'Buyer code is required' }, { status: 400 });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    // Admins and super_admins can set buyer codes on any lead
    lead.buyerCode = buyerCode;
    await lead.save();

    return NextResponse.json({
      message: 'Buyer code updated',
      lead: {
        _id: lead._id,
        buyerCode: lead.buyerCode,
      },
    });
  } catch (error) {
    console.error('Error updating buyer code:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
