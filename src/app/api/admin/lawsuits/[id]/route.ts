import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import Lawsuit from '@/models/Lawsuit';
import { dbConnect } from '@/lib/dbConnect';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const decoded = getAuthToken(request);
    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (decoded.role !== 'super_admin') {
      return NextResponse.json(
        { message: 'Only super administrators can remove active lawsuits' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const lawsuit = await Lawsuit.findByIdAndDelete(id);
    if (!lawsuit) {
      return NextResponse.json({ message: 'Lawsuit not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lawsuit removed', id });
  } catch (error) {
    console.error('Error deleting lawsuit:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
