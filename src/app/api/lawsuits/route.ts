import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import Lawsuit from '@/models/Lawsuit';
import { dbConnect } from '@/lib/dbConnect';

/** List active lawsuits — any authenticated user */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const decoded = getAuthToken(request);
    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const lawsuits = await Lawsuit.find({ active: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return NextResponse.json({ lawsuits });
  } catch (error) {
    console.error('Error fetching lawsuits:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
