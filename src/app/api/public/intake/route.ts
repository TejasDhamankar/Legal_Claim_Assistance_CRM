import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import Lead from '@/models/Lead';
import { dbConnect } from '@/lib/dbConnect';
import { DYNAMIC_FIELDS } from '@/lib/dynamic-fields';
import { getPublicClientConfig, PUBLIC_INTAKE_NOTE_MARKER, verifyIntakeToken } from '@/lib/public-intake';

type RateBucket = {
  count: number;
  resetAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var publicIntakeRateLimit: Map<string, RateBucket> | undefined;
}

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MIN_FORM_FILL_MS = 2500;

const intakeSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().min(1, 'Phone number is required'),
  dateOfBirth: z.string().trim().min(1, 'Date of birth is required'),
  address: z.string().trim().min(1, 'Address is required'),
  applicationType: z.string().trim().min(1, 'Application type is required'),
  lawsuit: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  fields: z.record(z.string(), z.any()).optional().default({}),
  clientSlug: z.string().trim().min(1, 'Client slug is required'),
  token: z.string().trim().min(1, 'Token is required'),
  hp: z.string().optional().default(''),
  startedAt: z.number(),
  source: z.string().trim().optional().default('public_link'),
});

const getClientIp = (request: NextRequest): string => {
  const fromHeader = request.headers.get('x-forwarded-for');
  if (fromHeader) return fromHeader.split(',')[0].trim();
  return 'unknown';
};

const isRateLimited = (key: string): boolean => {
  const now = Date.now();
  if (!global.publicIntakeRateLimit) {
    global.publicIntakeRateLimit = new Map<string, RateBucket>();
  }

  const bucket = global.publicIntakeRateLimit.get(key);
  if (!bucket || bucket.resetAt <= now) {
    global.publicIntakeRateLimit.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  bucket.count += 1;
  global.publicIntakeRateLimit.set(key, bucket);
  return bucket.count > RATE_LIMIT_MAX;
};

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const parsed = intakeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid submission', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    if (payload.hp) {
      return NextResponse.json({ message: 'Invalid submission' }, { status: 400 });
    }

    if (Date.now() - payload.startedAt < MIN_FORM_FILL_MS) {
      return NextResponse.json({ message: 'Submitted too quickly' }, { status: 400 });
    }

    const tokenResult = verifyIntakeToken(payload.token, payload.clientSlug);
    if (!tokenResult.valid) {
      return NextResponse.json({ message: tokenResult.reason || 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIp(request);
    if (isRateLimited(`${payload.clientSlug}:${ip}`)) {
      return NextResponse.json({ message: 'Too many requests, try again later' }, { status: 429 });
    }

    const clientConfig = getPublicClientConfig(payload.clientSlug);
    if (!clientConfig) {
      return NextResponse.json({ message: 'Invalid client link' }, { status: 404 });
    }

    const configFields = DYNAMIC_FIELDS[payload.applicationType] || [];
    const requiredDynamicFields =
      payload.applicationType === 'Juvenile Detention Center (JDC)'
        ? configFields.filter(field => field.key === 'Location Of Incident')
        : configFields.filter(field => field.required);

    const missingFields = requiredDynamicFields
      .filter(field => !payload.fields[field.key])
      .map(field => field.label);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { message: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const fieldsArray = Object.entries(payload.fields || {})
      .filter(([, value]) => value !== undefined && value !== null && `${value}`.trim() !== '')
      .map(([key, value]) => ({ key, value: `${value}` }));

    const createdBy =
      clientConfig.createdBy && mongoose.Types.ObjectId.isValid(clientConfig.createdBy)
        ? clientConfig.createdBy
        : undefined;
    const organizationId =
      clientConfig.organizationId && mongoose.Types.ObjectId.isValid(clientConfig.organizationId)
        ? clientConfig.organizationId
        : undefined;

    const sourceNote = `${PUBLIC_INTAKE_NOTE_MARKER} source=${payload.source}; client=${payload.clientSlug}`;
    const notes = payload.notes ? `${payload.notes}\n\n${sourceNote}` : sourceNote;

    const lead = await Lead.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      dateOfBirth: payload.dateOfBirth,
      address: payload.address,
      applicationType: payload.applicationType,
      lawsuit: payload.lawsuit || '',
      notes,
      status: 'PENDING',
      fields: fieldsArray,
      createdBy,
      organizationId,
      statusHistory: [
        {
          fromStatus: '',
          toStatus: 'PENDING',
          notes: 'Lead created from public intake form',
          changedBy: createdBy,
          timestamp: new Date(),
        },
      ],
    });

    return NextResponse.json({ message: 'Lead created successfully', leadId: lead._id }, { status: 201 });
  } catch (error) {
    console.error('Error creating public intake lead:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
