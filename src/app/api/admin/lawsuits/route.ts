import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import Lawsuit from '@/models/Lawsuit';
import { dbConnect } from '@/lib/dbConnect';
import { lawsuitColor } from '@/lib/lawsuit-color';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const decoded = getAuthToken(request);
    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (decoded.role !== 'super_admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const lawsuits = await Lawsuit.find().sort({ sortOrder: 1, name: 1 }).lean();
    return NextResponse.json({ lawsuits });
  } catch (error) {
    console.error('Error fetching lawsuits:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const decoded = getAuthToken(request);
    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (decoded.role !== 'super_admin') {
      return NextResponse.json(
        { message: 'Only super administrators can add active lawsuits' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json({ message: 'Lawsuit name is required' }, { status: 400 });
    }

    const existing = await Lawsuit.findOne({
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });
    if (existing) {
      if (!existing.active) {
        existing.active = true;
        existing.name = name;
        if (body.color) existing.color = body.color;
        await existing.save();
        return NextResponse.json({ lawsuit: existing }, { status: 200 });
      }
      return NextResponse.json(
        { message: 'An active lawsuit with this name already exists' },
        { status: 409 }
      );
    }

    const count = await Lawsuit.countDocuments();
    const color =
      typeof body.color === 'string' && body.color.trim()
        ? body.color.trim()
        : lawsuitColor(name);

    const lawsuit = await Lawsuit.create({
      name,
      color,
      active: true,
      sortOrder: count,
    });

    return NextResponse.json({ lawsuit }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { message: 'An active lawsuit with this name already exists' },
        { status: 409 }
      );
    }
    console.error('Error creating lawsuit:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
