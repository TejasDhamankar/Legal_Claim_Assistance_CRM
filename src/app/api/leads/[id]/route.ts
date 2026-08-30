import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import Lead from '@/models/Lead';
import { dbConnect } from '@/lib/dbConnect';
import { DYNAMIC_FIELDS } from '@/lib/dynamic-fields';

const LEAD_STATUS_ENUM = [
  'PENDING', 'REJECTED', 'VERIFIED', 'REJECTED_BY_CLIENT', 'PAID', 'DUPLICATE',
  'DUPLICATE_WITH_CLIENT', 'DUPLICATE_WITH_LAW_FIRM',
  'NOT_RESPONDING', 'FELONY', 'DEAD_LEAD', 'WORKING', 'CALL_BACK',
  'ATTEMPT_1', 'ATTEMPT_2', 'ATTEMPT_3', 'ATTEMPT_4', 'CHARGEBACK',
  'WAITING_ID', 'SENT_TO_CLIENT', 'QC', 'ID_VERIFIED', 'BILLABLE',
  'CAMPAIGN_PAUSED', 'SENT_TO_LAW_FIRM', 'RETURNED', 'REFRESH',
  'POSTED', 'SIGNED', 'VM', 'TRANSFERRED', 'READY_TO_TRANSFER', 'SEND_TO_ANOTHER_BUYER',
] as const;

const normalizeStatus = (value?: string) => {
  if (!value) return '';
  const trimmed = value.trim();
  const map: Record<string, string> = {
    'SEND TO ANOTHER BUYER': 'SEND_TO_ANOTHER_BUYER',
    'SENT TO CLIENT': 'SENT_TO_CLIENT',
    'SENT TO LAW FIRM': 'SENT_TO_LAW_FIRM',
  };
  return map[trimmed] || trimmed;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const decoded = getAuthToken(request);
    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: leadId } = await params;

    const lead = await Lead.findById(leadId)
      .populate('createdBy', 'name email')
      .populate('statusHistory.changedBy', 'name email');

    if (!lead) return NextResponse.json({ message: 'Lead not found' }, { status: 404 });

    if (
      decoded.role !== 'super_admin' &&
      lead.createdBy &&
      lead.createdBy._id.toString() !== decoded.id
    ) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 403 });
    }

    return NextResponse.json({ lead });
  } catch (error: any) {
    console.error('GET /api/leads/[id]', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const decoded = getAuthToken(request);
    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const body = await request.json();

    if (decoded.role !== 'super_admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) return NextResponse.json({ message: 'Lead not found' }, { status: 404 });

    const isStatusOnlyUpdate =
      body.status !== undefined &&
      !body.fields &&
      !body.firstName &&
      !body.lastName &&
      !body.email &&
      !body.phone &&
      !body.applicationType &&
      !body.lawsuit &&
      !body.address &&
      body.dateOfBirth === undefined;

    // Status-only updates should not require case questionnaire fields
    if (!isStatusOnlyUpdate) {
      const applicationType = body.applicationType || lead.applicationType;
      const incomingFields =
        body.fields && typeof body.fields === 'object' && !Array.isArray(body.fields)
          ? body.fields
          : Array.isArray(lead.fields)
            ? lead.fields.reduce((acc: Record<string, string>, field: { key: string; value: string }) => {
                if (field?.key) acc[field.key] = field.value || '';
                return acc;
              }, {})
            : {};

      const dynamicFieldsConfig = DYNAMIC_FIELDS[applicationType] || [];
      const isJuvenileAbuse = applicationType === 'Juvenile Detention Center (JDC)';
      const requiredFields = isJuvenileAbuse
        ? dynamicFieldsConfig.filter((f) => f.key === 'Location Of Incident')
        : dynamicFieldsConfig.filter((f) => f.required);
      const missingFields = requiredFields.filter(
        (field) => !incomingFields[field.key]?.toString().trim()
      );

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            message: `Missing required fields: ${missingFields.map((field) => field.label).join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    if (body.status) {
      const nextStatus = normalizeStatus(body.status);
      if (!LEAD_STATUS_ENUM.includes(nextStatus as (typeof LEAD_STATUS_ENUM)[number])) {
        return NextResponse.json(
          { message: `Invalid status: ${body.status}` },
          { status: 400 }
        );
      }

      if (nextStatus !== lead.status) {
        if (!Array.isArray(lead.statusHistory)) {
          lead.statusHistory = [];
        }
        lead.statusHistory.push({
          fromStatus: lead.status,
          toStatus: nextStatus,
          notes: body.statusNote || body.notes || '',
          changedBy: decoded.id,
          timestamp: new Date(),
        });
        lead.status = nextStatus;
      }
    }

    if (body.fields && typeof body.fields === 'object' && !Array.isArray(body.fields)) {
      lead.fields = Object.entries(body.fields)
        .filter(([, v]) => v)
        .map(([k, v]) => ({ key: k, value: v as string }));
    }

    const updateable = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
      'address',
      'applicationType',
      'lawsuit',
      'notes',
    ] as const;
    updateable.forEach((field) => {
      if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
        (lead as any)[field] = body[field];
      }
    });

    await lead.save();

    const populated = await Lead.findById(lead._id)
      .populate('createdBy', 'name email')
      .populate('statusHistory.changedBy', 'name email');

    return NextResponse.json({ message: 'Updated successfully', lead: populated });
  } catch (error: any) {
    console.error('PUT /api/leads/[id]', error);
    if (error?.name === 'ValidationError') {
      return NextResponse.json(
        { message: error.message || 'Validation failed' },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
