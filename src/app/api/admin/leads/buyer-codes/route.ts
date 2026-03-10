import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from '@/lib/auth';
import Lead from '@/models/Lead';
import { dbConnect } from '@/lib/dbConnect';
import { PUBLIC_INTAKE_NOTE_REGEX } from '@/lib/public-intake';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const decoded = getAuthToken(request);
    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;
    const userRole = decoded.role;

    if (!['admin', 'super_admin'].includes(userRole as string)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const query: any = {};
    if (userRole === 'admin') {
      query.createdBy = userId;
      query.notes = { $not: PUBLIC_INTAKE_NOTE_REGEX };
    }

    const buyerCodes = await Lead.distinct('buyerCode', query);
    const cleaned = buyerCodes
      .filter((code: string | null | undefined) => typeof code === 'string' && code.trim().length > 0)
      .sort((a: string, b: string) => a.localeCompare(b));

    return NextResponse.json({ buyerCodes: cleaned });
  } catch (error) {
    console.error('Error fetching buyer codes:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
